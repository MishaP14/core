import Components from '../index'
import { errorComponent } from '../../../../utils/errors/component'

export default class Basic extends Components {
  constructor(...args) {
    super(...args)
  }
  async init() {
    const createBasic = () => this.create(this.proxies.bind(this), this.nodeElement, this.node.component, this.proxies(this.node.component.proxies, this.nodeElement))
    if (this.node.component.induce) {
      if (typeof this.node.component.induce !== 'function') return errorComponent(this.nodeElement.nodepath, 212)
      this.nodeElement.setAttribute('induced', '')
      this.impress.collect = true
      const permit = this.node.component.induce()
      const mount = async () => await createBasic()
      this.reactiveNode(this.impress.define(), async () => {
        if (!this.node.component.induce()) {
          await this.nodeElement.unmount?.()
        } else if (!this.nodeElement.unmount) await mount()
      })
      if (permit) mount()
    } else {
      await createBasic()
    }
  }
  proxies(proxies, target) {
    const reactive = (pr, fn) => this.reactiveComponent(this.impress.define(pr), (v, p) => {
      if (target.proxy && target.proxy[pr]) {
        p ? target.proxy[pr](v, p) : target.proxy[pr](fn())
      }
    }, target)
    return this.reactivate(proxies, reactive, null, null, target)
  }
}