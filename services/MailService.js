const Imap = require('node-imap');
const simpleParser = require("mailparser").simpleParser;
const { setRedisKey, getRedisKey } = require('./RedisService');
const { autoAgent } = require('./ProxyService');

const use_graph_api = async (refresh_token, client_id, mailbox, email, socks5, http) => {

    let temp_mailbox = mailbox
    if (mailbox != "INBOX" && mailbox != "Junk") {
        temp_mailbox = "inbox";
    }

    if (mailbox == 'INBOX') {
        temp_mailbox = 'inbox';
    }

    if (mailbox == 'Junk') {
        temp_mailbox = 'junkemail';
    }

    const redis_name = 'graph_api_result_' + email + '_access_token'
    const redis_result = await getRedisKey(redis_name)

    if (redis_result) {
        return {
            access_token: redis_result,
            status: true,
            mailbox: temp_mailbox
        }
    }

    const agentOptions = autoAgent(socks5, http);

    const response = await agentOptions.fetch('https://login.microsoftonline.com/consumers/oauth2/v2.0/token', {
        method: 'POST',
        ...agentOptions.proxy,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            'client_id': client_id,
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token,
            'scope': 'https://graph.microsoft.com/.default'
        }).toString()
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
    }

    const responseText = await response.text();

    try {

        const data = JSON.parse(responseText);
        const status = data.scope.indexOf('https://graph.microsoft.com/Mail.Read') != -1

        if (status) {
            await setRedisKey(redis_name, data.access_token, data.expires_in - 60)
        }

        return {
            access_token: data.access_token,
            status: status,
            mailbox: temp_mailbox
        }
    } catch (parseError) {
        throw new Error(`Failed to parse JSON: ${parseError.message}, response: ${responseText}`);
    }
}

const use_get_graph_emails = async (graph_api_result, top = 10000, email, socks5, http) => {

    try {

        const agentOptions = autoAgent(socks5, http);

        const response = await agentOptions.fetch(`https://graph.microsoft.com/v1.0/me/mailFolders/${graph_api_result.mailbox}/messages?$top=${top}`, {
            method: 'GET',
            ...agentOptions.proxy,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                "Authorization": `Bearer ${graph_api_result.access_token}`
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
        }

        const responseData = await response.json();

        const emails = responseData.value;

        const response_emails = emails.map(item => {
            return {
                id: item['id'],
                send: item['from']['emailAddress']['address'],
                subject: item['subject'],
                text: item['bodyPreview'],
                html: item['body']['content'],
                date: item['createdDateTime'],
            }
        })

        return response_emails

    } catch (error) {
        throw error;
    }

}

const use_imap_api = async (refresh_token, client_id, email, socks5, http) => {

    const redis_name = 'imap_api_result_' + email + '_access_token'
    const redis_result = await getRedisKey(redis_name)

    if (redis_result) {
        return {
            access_token: redis_result,
        }
    }

    const agentOptions = autoAgent(socks5, http);

    const response = await agentOptions.fetch('https://login.microsoftonline.com/consumers/oauth2/v2.0/token', {
        method: 'POST',
        ...agentOptions.proxy,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            'client_id': client_id,
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token
        }).toString()
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
    }

    const responseText = await response.text();

    try {
        const data = JSON.parse(responseText);
        await setRedisKey(redis_name, data.access_token, data.expires_in - 60)
        return {
            access_token: data.access_token,
        };
    } catch (parseError) {
        throw new Error(`Failed to parse JSON: ${parseError.message}, response: ${responseText}`);
    }
}

const generateAuthString = (email, accessToken) => {
    const authString = `user=${email}\x01auth=Bearer ${accessToken}\x01\x01`;
    return Buffer.from(authString).toString('base64');
}

const use_get_imap_emails = (email, authString, mailbox = "INBOX", top = 10000, socks5, http) => {
    return new Promise((resolve, reject) => {
        const imap = new Imap({
            user: email,
            xoauth2: authString,
            host: 'outlook.office365.com',
            port: 993,
            tls: true,
            tlsOptions: {
                rejectUnauthorized: false
            }
        });
        const emailList = [];
        let messageCount = 0;
        let processedCount = 0;

        imap.once("ready", async () => {
            try {
                // 动态打开指定的邮箱（如 INBOX 或 Junk）
                await new Promise((resolve, reject) => {
                    imap.openBox(mailbox, true, (err, box) => {
                        if (err) return reject(err);
                        resolve(box);
                    });
                });

                const results = await new Promise((resolve, reject) => {
                    imap.search(["ALL"], (err, results) => {
                        if (err) return reject(err);

                        let temp_top = top;

                        if (temp_top > results.length) {
                            temp_top = results.length;
                        }

                        // 抛出最近的 temp_top 条邮件
                        resolve(results.slice(-temp_top));
                    });
                });

                if (results.length === 0) {
                    imap.end();
                    return;
                }

                messageCount = results.length;
                const f = imap.fetch(results, { bodies: "" });

                f.on("message", (msg, seqno) => {
                    msg.on("body", (stream, info) => {
                        // 使用 Promise 包装 simpleParser 以确保所有邮件都被处理完成
                        simpleParser(stream)
                            .then(mail => {
                                const data = {
                                    send: mail.from.text,
                                    subject: mail.subject,
                                    text: mail.text,
                                    html: mail.html,
                                    date: mail.date,
                                };
                                emailList.push(data);
                            })
                            .catch(err => {
                                console.error('Error parsing email:', err);
                            })
                            .finally(() => {
                                processedCount++;
                                // 当所有邮件都处理完成后关闭连接
                                if (processedCount === messageCount) {
                                    imap.end();
                                }
                            });
                    });
                });

                f.once("error", (err) => {
                    console.error('IMAP fetch error:', err);
                    reject(err);
                    imap.end();
                });
            } catch (err) {
                console.error('IMAP ready error:', err);
                reject(err);
                imap.end();
            }
        });

        imap.once('error', (err) => {
            console.error('IMAP connection error:', err);
            reject(err);
        });

        imap.once('end', () => {
            resolve(emailList);
            console.log('IMAP connection ended');
        });

        imap.connect();
    })
}

const process_mails = (email, authString, mailbox = "INBOX", socks5, http) => {
    const imap = new Imap({
        user: email,
        xoauth2: authString,
        host: 'outlook.office365.com',
        port: 993,
        tls: true,
        tlsOptions: {
            rejectUnauthorized: false
        }
    });

    async function openInbox() {
        return new Promise((resolve, reject) => {
            imap.openBox(mailbox, true, (err, box) => {
                if (err) return reject(err);
                resolve(box);
            });
        });
    }

    async function openInboxFolder() {
        return new Promise((resolve, reject) => {
            imap.openBox(mailbox, false, (err, box) => {
                if (err) return reject(err);
                resolve(box);
            });
        });
    }

    async function searchEmails() {
        return new Promise((resolve, reject) => {
            imap.search(['ALL'], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    async function markAsDeleted(uids) {
        return new Promise((resolve, reject) => {
            imap.addFlags(uids, ['\\Deleted'], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    }

    async function expungeDeleted() {
        return new Promise((resolve, reject) => {
            imap.expunge((err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    }

    imap.once('ready', async () => {
        try {
            await openInbox();
            await openInboxFolder();

            const results = await searchEmails();
            if (results.length === 0) {
                console.log('No emails found in mailbox:', mailbox);
                imap.end();
            }

            const f = imap.fetch(results, { bodies: '' });

            f.on('message', (msg, seqno) => {
                console.log('Message #%d', seqno);
                msg.on('attributes', async (attrs) => {
                    await markAsDeleted([attrs.uid]);
                    console.log('Marked as deleted:', seqno);
                });
            });

            f.once('error', (err) => {
                console.log('Fetch error: ' + err);
                imap.end();
            });

            f.once('end', async () => {
                console.log('Done fetching all messages!');
                await expungeDeleted();
                console.log('Expunged deleted messages.');
                imap.end();
            });
        } catch (err) {
            console.error('Error:', err);
            imap.end();
        }
    });

    imap.once('error', (err) => {
        console.log(err);
        imap.end();
    });

    imap.once('end', () => {
        console.log('Connection ended');
    });

    imap.connect();
}

const use_test_proxy = async (socks5, http) => {

    const agentOptions = autoAgent(socks5, http);

    const response = await agentOptions.fetch('https://unix.xin/api/get_ip', {
        ...agentOptions.proxy,
    })

    const body = await response.json();

    return {
        ip: body.ip,
    };
}

const use_delete_graph_emails = (graph_api_result, id, socks5, http) => {
    const agentOptions = autoAgent(socks5, http);
    agentOptions.fetch(`https://graph.microsoft.com/v1.0/me/messages/${id}`, {
        ...agentOptions.proxy,
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${graph_api_result.access_token}`,
            'Content-Type': 'application/json',
        },
    })

    console.log(`Deleted email with id: ${id}`);
    
}



module.exports = {
    use_graph_api,
    use_get_graph_emails,
    use_imap_api,
    generateAuthString,
    use_get_imap_emails,
    process_mails,
    use_test_proxy,
    use_delete_graph_emails,
}