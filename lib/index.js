// dsh-hotkeys —— 宿主侧入口。
// 所有实际行为在浏览器端 lib/client.js（经 package.json 的 dsh.client 声明挂载）。
// 宿主侧保留一个最小 Cordis 插件，供 Loader 正常挂载与卸载。

export const name = 'dsh-hotkeys'

/**
 * 宿主侧目前无逻辑；如后期需要读取宿主设置/服务，在这里扩展。
 * @param {import('cordis').Context} ctx
 */
export function apply(ctx) {
  ctx.effect(() => {
    // 预留：后期可在这里注册配置服务或读取 $DSH_HOME/settings.yaml
    return () => {}
  })
}
