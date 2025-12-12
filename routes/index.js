const Router = require("koa-router");
const apiRoutes = require("./api");
const { authPasswordMiddleware, authParamsMiddleware } = require("../middlewares/auth.middleware");

const router = new Router();

// 根路由
router.get("/", async (ctx) => {
  ctx.body = {
    message: `Welcome to Be ${process.env.API_NAME || "MS_OAuth2API_Next"}`,
  };
});

// API路由
router.use(
  "/api",
  authPasswordMiddleware,
  authParamsMiddleware,
  apiRoutes.routes(),
  apiRoutes.allowedMethods()
);

module.exports = router;
