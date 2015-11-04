import alt from 'alt';

class AltProxy {

  constructor(realActions, ActionsClass) {
    this.Alt = new alt();

    this.realActions = realActions;
    this.proxyActions = this.Alt.createActions(ActionsClass);
  }

  createStoreProxy(StoreProxyClass) {
    return this.Alt.createStore(StoreProxyClass, 'Proxy' + StoreProxyClass.displayName, this.proxyActions, this.realActions);
  }

}

export default AltProxy;
