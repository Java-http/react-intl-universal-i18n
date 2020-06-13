interface TEventMap {
  [key:string]:any|null[]
}

class EventBus {
  eventMap:TEventMap = {};

  on = (eventName:string, callback:any) => {
    let callBackList = this.eventMap[eventName];
    if (!callBackList) {
      callBackList = [];
      this.eventMap[eventName] = callBackList;
    }
    if (callback && typeof callback === 'function') {
      callBackList.push(callback);
    }
  };

  emit = (eventName:string, ...params:any[]) => {
    const callBackList = this.eventMap[eventName];
    if (callBackList instanceof Array && callBackList.length > 0) {
      callBackList.forEach((callback) => {
        if (callback && typeof callback === 'function') {
          callback(...params);
        }
      });
    }
  };

  remove = (eventName:string) => {
    this.eventMap[eventName] = null;
  };
}

export default new EventBus();