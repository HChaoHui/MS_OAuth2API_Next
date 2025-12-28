<template>
    <div class="home-container">
        <el-form :model="toolForm" :rules="toolRules" ref="formRef" :inline="true">
            <el-row>
                <el-col :span="24">
                    <el-form-item label="分隔符：" label-width="70px">
                        <el-input v-model="toolForm.splitSymbol" />
                    </el-form-item>
                    <el-form-item>
                        <el-upload ref="upload" :limit="1" :show-file-list="false" :on-exceed="handleExceed"
                            :auto-upload="false" :on-change="handleFileChange" accept=".txt,.csv" class="custom-upload">
                            <template #trigger>
                                <el-button type="primary">
                                    <el-icon>
                                        <FilesIcon />
                                    </el-icon>
                                    {{ fileName || '选择文件' }}
                                </el-button>
                            </template>
                        </el-upload>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="success" @click="handleAdd">
                            <el-icon>
                                <UploadIcon />
                            </el-icon>
                            导入邮箱
                        </el-button>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="success" @click="dialogCopyVisible = true">
                            <el-icon>
                                <CopyDocumentIcon />
                            </el-icon>
                            粘贴导入
                        </el-button>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="warning" @click="handleBatchExport">
                            <el-icon>
                                <DownloadIcon />
                            </el-icon>
                            批量导出
                        </el-button>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="warning" @click="handleExportAll">
                            <el-icon>
                                <DownloadIcon />
                            </el-icon>
                            全部导出
                        </el-button>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="warning" @click="handleBatchDelete">
                            <el-icon>
                                <DeleteIcon />
                            </el-icon>
                            批量删除
                        </el-button>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="danger" @click="handleDeleteAll">
                            <el-icon>
                                <DeleteFilledIcon />
                            </el-icon>
                            全部删除
                        </el-button>
                    </el-form-item>
                </el-col>
            </el-row>
        </el-form>

        <div class="table">
            <el-table ref="multipleTableRef" :height="calcTableHeight" stripe :data="tableMailList" row-key="email"
                style="width: 100%" size="large" @selection-change="handleSelectionChange" center>
                <el-table-column type="selection" width="55" />
                <el-table-column show-overflow-tooltip prop="email" label="邮箱" />
                <el-table-column show-overflow-tooltip prop="client_id" label="客户端ID" />
                <el-table-column show-overflow-tooltip prop="refresh_token" label="刷新令牌" />

                <el-table-column label="操作" width="300">
                    <template #default="scope">
                        <el-button size="small" type="primary" @click="handleEdit(scope.row, scope.$index)">
                            编辑
                        </el-button>
                        <el-button size="small" type="success" @click="handleInbox(scope.row)">
                            收件箱
                        </el-button>
                        <el-button size="small" type="success" @click="handleTrash(scope.row)">
                            垃圾箱
                        </el-button>
                        <el-button size="small" type="danger" @click="handleDelete(scope.row, scope.$index)">
                            删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>
        <div class="pagination" ref="tablePaginationRef">
            <el-pagination background v-model:current-page="tablePagination.currentPage"
                v-model:page-size="tablePagination.pageSize" :page-sizes="[5, 10, 20, 50, 100]"
                :size="tablePagination.defaultSize" layout="total, sizes, prev, pager, next"
                :total="tablePagination.total" @size-change="handleTableSizeChange"
                @current-change="handleTableCurrentChange" />
        </div>

        <el-dialog v-model="dialogCopyVisible" title="粘贴导入" width="800">
            <el-text class="mx-1" type="warning">请粘贴邮箱地址（每个邮箱地址占一行）</el-text>
            <div class="copy-textarea-container">
                <el-input v-model="copyTextarea" style="width: 100%" :rows="20" type="textarea" placeholder="请粘贴邮箱地址" />
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="dialogCopyVisible = false">取消</el-button>
                    <el-button type="primary" @click="handlePasteAdd">
                        导入
                    </el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog v-model="dialogEditVisible" title="编辑" width="800">

            <el-form :model="editForm" ref="editFormRef" label-width="120px">
                <el-form-item label="邮箱" prop="email">
                    <el-input v-model="editForm.email" placeholder="请输入邮箱" />
                </el-form-item>
                <el-form-item label="密码" prop="password">
                    <el-input v-model="editForm.password" type="password" placeholder="请输入密码" />
                </el-form-item>
                <el-form-item label="客户端ID" prop="client_id">
                    <el-input v-model="editForm.client_id" placeholder="请输入客户端ID" />
                </el-form-item>
                <el-form-item label="刷新令牌" prop="refresh_token">
                    <el-input v-model="editForm.refresh_token" type="textarea" :rows="10" placeholder="请输入刷新令牌" />
                </el-form-item>
            </el-form>

            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="dialogEditVisible = false">取消</el-button>
                    <el-button type="primary" @click="handleSave">
                        保存
                    </el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog v-model="dialogEmailVisible" :title="postTitle" width="1000">
            <el-button type="primary" @click="handleReceive" :loading="postLoading">
                收取新邮件
            </el-button>
            <el-button type="danger" @click="handleClear">
                清空
            </el-button>

            <div class="table">
                <el-table v-model="postList" style="width: 100%" size="default" :data="postList"
                    height="calc(100vh - 350px)">
                    <el-table-column prop="send" label="发件人" show-overflow-tooltip />
                    <el-table-column prop="subject" label="主题" show-overflow-tooltip />
                    <el-table-column prop="text" label="文本" show-overflow-tooltip />
                    <el-table-column prop="date" label="日期" show-overflow-tooltip />
                    <el-table-column label="操作" width="120">
                        <template #default="scope">
                            <el-button size="small" type="primary" @click="viewPost(scope.row)">
                                查看
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </el-dialog>

        <el-dialog v-model="dialogPostVisible" title="邮件内容" width="800">
            <div v-html="dialogEmailContent" style="height: calc(100vh - 400px); overflow: auto;"></div>
        </el-dialog>

    </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { genFileId, ElMessage, ElMessageBox } from 'element-plus'
import { Upload as UploadIcon, Plus as FilesIcon, Download as DownloadIcon, Delete as DeleteIcon, DeleteFilled as DeleteFilledIcon, CopyDocument as CopyDocumentIcon, DocumentCopy as DocumentCopyIcon } from '@element-plus/icons-vue'

import type { UploadInstance, UploadProps, UploadRawFile } from 'element-plus'

const upload = ref<UploadInstance>()
const emailList = ref<string[]>([])
const fileName = ref<string>('')

const handleExceed: UploadProps['onExceed'] = (files) => {
    upload.value!.clearFiles()
    const file = files[0] as UploadRawFile
    file.uid = genFileId()
    upload.value!.handleStart(file)
}

const handleFileChange: UploadProps['onChange'] = (file, fileList = []) => {
    if (fileList.length === 0) {
        fileName.value = ''
        return
    }

    const rawFile = fileList[0]?.raw as UploadRawFile | undefined

    if (!rawFile) {
        fileName.value = ''
        return
    }

    if (!rawFile.type.match(/text\/(plain|csv)/) &&
        !rawFile.name.endsWith('.txt') &&
        !rawFile.name.endsWith('.csv')) {
        ElMessage.error('请上传 .txt 或 .csv 格式的文件')
        upload.value!.clearFiles()
        fileName.value = ''
        return
    }

    fileName.value = rawFile.name.length > 10 ? rawFile.name.slice(0, 10) + '...' : rawFile.name

    parseFileContent(rawFile)
}

const parseFileContent = (file: UploadRawFile) => {
    const reader = new FileReader()

    reader.onload = (e) => {
        try {
            const content = e.target?.result as string
            if (!content) {
                ElMessage.error('文件内容为空')
                return
            }

            const matches = content.split('\n').map(item => item.trim()).filter(item => item !== '');

            if (matches.length > 0) {
                emailList.value = matches
            } else {
                ElMessage.warning('未在文件中找到邮箱地址')
                emailList.value = []
            }
        } catch (error) {
            console.error('解析文件失败:', error)
            ElMessage.error('解析文件失败，请检查文件格式')
        }
    }

    reader.onerror = () => {
        ElMessage.error('读取文件失败')
    }

    // 读取文件内容
    reader.readAsText(file)
}

const toolForm = ref({
    splitSymbol: '----'
})

const toolRules = ref({
    splitSymbol: [{ required: true, message: '请输入分隔符', trigger: 'blur' }]
})

import type { TableInstance } from 'element-plus'
interface Email {
    email: string
    password: string
    client_id: string
    refresh_token: string
}

const multipleTableRef = ref<TableInstance>()
const multipleSelection = ref<Email[]>([])

const toggleSelection = (rows?: Email[], ignoreSelectable?: boolean) => {
    if (rows) {
        rows.forEach((row) => {
            multipleTableRef.value!.toggleRowSelection(
                row,
                undefined,
                ignoreSelectable
            )
        })
    } else {
        multipleTableRef.value!.clearSelection()
    }
}

const handleSelectionChange = (val: Email[]) => {
    multipleSelection.value = val
}

const mailList = ref<Email[]>(JSON.parse(localStorage.getItem('localMailList') || '[]') as Email[])

const tablePagination = ref({
    currentPage: 1,
    pageSize: 5,
    defaultSize: 'default',
    total: mailList.value.length
})

const tableMailList = computed(() => {
    const start = (tablePagination.value.currentPage - 1) * tablePagination.value.pageSize
    const end = start + tablePagination.value.pageSize
    return mailList.value.slice(start, end)
})

const handleTableSizeChange = (val: number) => {
    tablePagination.value.pageSize = val
}

const handleTableCurrentChange = (val: number) => {
    tablePagination.value.currentPage = val
}

import type { FormInstance } from 'element-plus'
const formRef = ref<FormInstance>()
const formHeight = ref(0)
const tablePaginationRef = ref<HTMLDivElement>()
const tablePaginationHeight = ref(0)
const calcTableHeight = computed(() => {
    return `calc(100vh - ${formHeight.value}px - ${tablePaginationHeight.value}px - 40px - 140px)`
})

let formResizeObserver: ResizeObserver | null = null
let paginationResizeObserver: ResizeObserver | null = null
let windowResizeHandler: (() => void) | null = null

const updateAllHeights = () => {
    if (formRef.value?.$el) {
        formHeight.value = formRef.value.$el.offsetHeight || 0
    }

    if (tablePaginationRef.value) {
        tablePaginationHeight.value = tablePaginationRef.value.offsetHeight || 0
    }
}

onMounted(() => {
    nextTick(() => {
        updateAllHeights()
        if (formRef.value?.$el) {
            formResizeObserver = new ResizeObserver(entries => {
                for (const entry of entries) {
                    formHeight.value = entry.contentRect.height
                }
            })
            formResizeObserver.observe(formRef.value.$el)
        }

        if (tablePaginationRef.value) {
            paginationResizeObserver = new ResizeObserver(entries => {
                for (const entry of entries) {
                    tablePaginationHeight.value = entry.contentRect.height
                }
            })
            paginationResizeObserver.observe(tablePaginationRef.value)
        }

        windowResizeHandler = () => {
            updateAllHeights()
        }
        window.addEventListener('resize', windowResizeHandler)
    })
})

// 在组件卸载时清理所有监听器
onBeforeUnmount(() => {
    if (formResizeObserver) {
        formResizeObserver.disconnect()
        formResizeObserver = null
    }

    if (paginationResizeObserver) {
        paginationResizeObserver.disconnect()
        paginationResizeObserver = null
    }

    if (windowResizeHandler) {
        window.removeEventListener('resize', windowResizeHandler)
        windowResizeHandler = null
    }
})

// 批量删除选中的邮箱
const handleBatchDelete = () => {
    if (multipleSelection.value.length === 0) {
        ElMessage.warning('请选择要删除的邮箱')
        return
    }

    ElMessageBox.confirm('确认删除选中的邮箱吗？', '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        mailList.value = mailList.value.filter(item => !multipleSelection.value.includes(item))
        tablePagination.value.total = mailList.value.length
        localStorage.setItem('localMailList', JSON.stringify(mailList.value))
        toggleSelection()
        ElMessage.success('删除成功')
    }).catch(() => {
        ElMessage.info('已取消删除')
    })
}

// 删除所有邮箱
const handleDeleteAll = () => {
    ElMessageBox.confirm('确认删除所有邮箱吗？', '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        mailList.value = []
        tablePagination.value.total = 0
        localStorage.setItem('localMailList', JSON.stringify(mailList.value))
        toggleSelection()
        ElMessage.success('删除成功')
    }).catch(() => {
        ElMessage.info('已取消删除')
    })
}

// 添加邮箱
const handleAdd = () => {
    if (emailList.value.length === 0) {
        ElMessage.warning('请先选择文件解析')
        return
    }

    const localMailList = JSON.parse(localStorage.getItem('localMailList') || '[]') as Email[]
    mailList.value = localMailList.concat(emailList.value.map(item => {
        const tempArr = item.split(toolForm.value.splitSymbol)
        return {
            email: tempArr[0] || "",
            password: tempArr[1] || "",
            client_id: tempArr[2] || "",
            refresh_token: tempArr[3] || ""
        }
    }))
    localStorage.setItem('localMailList', JSON.stringify(mailList.value))
    tablePagination.value.total = mailList.value.length
    ElMessage.success('邮箱地址添加成功' + '共' + emailList.value.length + '条')
    emailList.value = []
    copyTextarea.value = ''
    dialogCopyVisible.value = false
    fileName.value = ''
    upload.value!.clearFiles()
}

// 粘贴添加邮箱
const dialogCopyVisible = ref(false)
const copyTextarea = ref('')
const handlePasteAdd = () => {
    emailList.value = copyTextarea.value.split('\n').map(item => item.trim()).filter(item => item !== '')
    handleAdd()
}

// 批量导出选中的邮箱
const handleBatchExport = () => {
    if (multipleSelection.value.length === 0) {
        ElMessage.warning('请选择要导出的邮箱')
        return
    }

    ElMessageBox.confirm('确认导出选中的邮箱吗？', '导出确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        const exportContent = multipleSelection.value.map(item => item.email + toolForm.value.splitSymbol + item.password + toolForm.value.splitSymbol + item.client_id + toolForm.value.splitSymbol + item.refresh_token).join('\n')
        const blob = new Blob([exportContent], { type: 'text/plain' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'selected_mails.txt'
        a.click()
        URL.revokeObjectURL(a.href)
        ElMessage.success('导出成功')
    }).catch(() => {
        ElMessage.info('已取消导出')
    })
}

// 导出所有邮箱
const handleExportAll = () => {

    if (mailList.value.length === 0) {
        ElMessage.warning('请先添加邮箱')
        return
    }

    ElMessageBox.confirm('确认导出所有邮箱吗？', '导出确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        const exportContent = mailList.value.map(item => item.email + toolForm.value.splitSymbol + item.password + toolForm.value.splitSymbol + item.client_id + toolForm.value.splitSymbol + item.refresh_token).join('\n')
        const blob = new Blob([exportContent], { type: 'text/plain' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'all_mails.txt'
        a.click()
        URL.revokeObjectURL(a.href)
        ElMessage.success('导出成功')
    }).catch(() => {
        ElMessage.info('已取消导出')
    })
}

// 编辑邮箱
const dialogEditVisible = ref(false)
const editForm = ref<Email>({
    email: '',
    password: '',
    client_id: '',
    refresh_token: ''
})
const editIndex = ref(-1)
const handleEdit = (row: Email, index: number) => {
    editIndex.value = (tablePagination.value.currentPage - 1) * tablePagination.value.pageSize + index
    editForm.value = JSON.parse(JSON.stringify(row))
    dialogEditVisible.value = true
}

const handleSave = () => {
    if (editIndex.value === -1) {
        ElMessage.error('编辑索引错误')
        return
    }

    mailList.value[editIndex.value] = editForm.value
    localStorage.setItem('localMailList', JSON.stringify(mailList.value))
    tablePagination.value.total = mailList.value.length
    dialogEditVisible.value = false
    ElMessage.success('保存成功')
}

// 删除邮箱
const handleDelete = (row: Email, index: number) => {
    ElMessageBox.confirm('确认删除邮箱 ' + row.email + ' 吗？', '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        mailList.value.splice(index, 1)
        localStorage.setItem('localMailList', JSON.stringify(mailList.value))
        tablePagination.value.total = mailList.value.length
        ElMessage.success('删除成功')
    }).catch(() => {
        ElMessage.info('已取消删除')
    })
}

interface Post {
    send: string
    subject: string
    text: string
    html: string
    date: string
}

const dialogEmailVisible = ref(false)
const boxType = ref('INBOX')
const postList = ref<Post[]>([])
const postTitle = ref('')
const nowPost = ref<Email>({
    email: '',
    password: '',
    client_id: '',
    refresh_token: ''
})

const postLoading = ref(false)

const handleInbox = (row: Email) => {
    boxType.value = 'INBOX'
    postTitle.value = row.email + "的收件箱"
    handlePost(row)
}

const handleTrash = (row: Email) => {
    boxType.value = 'Junk'
    postTitle.value = row.email + "的垃圾箱"
    handlePost(row)
}

const handlePost = (row: Email) => {
    nowPost.value = row
    postList.value = JSON.parse(localStorage.getItem(row.email + boxType.value) || '[]');
    getPosts(row.email, row.password, row.client_id, row.refresh_token, boxType.value)
    dialogEmailVisible.value = true
}

// 收取新邮件
const handleReceive = () => {
    const { email, password, client_id, refresh_token } = nowPost.value
    getPosts(email, password, client_id, refresh_token, boxType.value)

}

const getPosts = async (email: string, password: string, client_id: string, refresh_token: string, mailbox: string) => {
    postLoading.value = true
    try {
        const response = await fetch('/api/mail_all', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password,
                client_id,
                refresh_token,
                mailbox
            })
        })
        const data = await response.json()

        if (data.code == 200) {
            postList.value = data.data
            localStorage.setItem(nowPost.value.email + boxType.value, JSON.stringify(postList.value))
            ElMessage.success('收取成功')
        }

    } catch (error) {
        ElMessage.error('收取失败')
    }
    postLoading.value = false
}

const dialogPostVisible = ref(false)
const dialogEmailContent = ref('')

const viewPost = (post: Post) => {
    dialogPostVisible.value = true
    dialogEmailContent.value = post.html
}

// 清空邮箱
const handleClear = () => {
    ElMessageBox.confirm('确认清空邮箱 ' + nowPost.value.email + ' 的所有邮件吗？', '清空确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        postList.value = []
        localStorage.setItem(nowPost.value.email + boxType.value, JSON.stringify(postList.value))
        clearPosts(nowPost.value.email, nowPost.value.password, nowPost.value.client_id, nowPost.value.refresh_token, boxType.value)
        ElMessage.success('邮箱正在清空中... 请稍后查看')
    }).catch(() => {
        ElMessage.info('已取消清空')
    })
}

const clearPosts = (email: string, password: string, client_id: string, refresh_token: string, mailbox: string) => {
    fetch('/api/process-mailbox', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email,
            password,
            client_id,
            refresh_token,
            mailbox
        })
    })
}
</script>

<style scoped>
/* 隐藏默认上传列表 */
.custom-upload :deep(.el-upload__tip),
.custom-upload :deep(.el-upload__list) {
    display: none;
}

/* 自定义上传按钮样式 */
.upload-button {
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: 250px;
    overflow: hidden;
}

/* 确保文件名显示在按钮内 */
.upload-button span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

:deep(.el-form--inline .el-form-item) {
    margin-right: 10px;
}

.table {
    margin-top: 20px;
}

:deep(.el-table--enable-row-transition .el-table__body td.el-table__cell) {
    padding: 20px 0px;
}

.pagination {
    margin-top: 20px;
    display: flex;
    justify-content: center;
}

.copy-textarea-container {
    display: flex;
    justify-content: center;
    margin-top: 20px;
}
</style>
