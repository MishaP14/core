import route from '../route/index.js'
import link from '../link.js'
import collectorRoutes from '../collectorRoutes.js'

export default class RouterBasic {
  constructor(options) {
    this.routes = options.routes
    this.afterEach = options.afterEach
    this.beforeEach = options.beforeEach
    this.beforeEnter = options.beforeEnter
    this.afterEnter = options.afterEnter
    this.stores = null
    this.router = {
      layouts: options.layouts || {},
      collection: [],
      push: this.push.bind(this),
      link: this.link.bind(this),
      from: null,
      to: null,
      render: () => {}
    }
    collectorRoutes(this.routes, this.router.collection)
  }
  initBasic(app) {
    this.origin = app.origin
    if (app.plugins.store) this.stores = app.plugins.store.getAll()
    app.plugins.router = this.router
  }
  link(v)  {
    return link(v, this.router.to, this.router.collection)
  }
  async push(v) {
    const path = this.link(v)
    this.setHistory && this.setHistory(v, path)
    const url = new URL((this.origin || window.location.origin) + path)
    await this.update(url)
    return path
  }
  async beforeHooks(hook, to, from) {
    if (hook) {
      const res = await hook(to, from)
      if (res) {
        this.push(res)
        return true
      }
    }
  }
  async afterHooks(hook, to, from) {
    if (hook) await hook(to, from)
  }
  async update(url) {
    let res = null
    if (await this.beforeHooks(this.beforeEach, this.router.to, this.router.from)) return
    const to = route.init(this.router.collection, url)
    const from = this.router.to || null
    const target = to.route
    if (target) {
      this.router.from = from
      this.router.to = to
      this.router.to.route.staticFile = this.router.to.route.type === 'static' && !this.router.from
      if (await this.beforeHooks(this.beforeEnter, to, from)) return
      if (await this.beforeHooks(target.beforeEnter, to, from)) return
      if (this.stores) {
        for await (const module of Object.values(this.stores)) {
          if (await this.beforeHooks(module.store.beforeEnter?.bind(module.context), to, from)) return
        }
      }
      if (target.redirect) {
        let v = target.redirect
        typeof v === 'function' ? await this.push(await v(to, from)) : await this.push(v)
        return
      }
      res = await this.router.render(to, from)
      await this.afterHooks(this.afterEnter, to, from)
      await this.afterHooks(target.afterEnter, to, from)
      if (this.stores) {
        for await (const module of Object.values(this.stores)) {
          await this.afterHooks(module.store.afterEnter?.bind(module.context), to, from)
        }
      }
    }
    await this.afterHooks(this.afterEach, to, from)
    return res
  }
}