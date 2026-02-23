// Worker 的环境接口，告诉 TypeScript 我们有哪些绑定
interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    // 预留 API 路由，方便未来扩展
    // 比如添加访问统计、留言板等功能
    if (url.pathname.startsWith("/api/")) {
      // 现在先返回个友好的提示
      return new Response("API 功能开发中，敬请期待! 🚧");
    }

    // 其他请求都交给静态资源处理
    // Workers 会自动处理缓存、压缩等优化
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
