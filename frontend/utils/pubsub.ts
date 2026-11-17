// Ported from ai-media-cpcm-frontend-ui/utils/pubsub.js — the project's
// replacement for React Context/a store for cross-cutting UI state (global
// modal, toast). Components subscribe in useEffect and MUST unsubscribe with
// the returned subscriptionId, not the handler.

// A generic pub/sub bus necessarily carries heterogeneous event payloads
// (app__modal's {event_name, data, modifier_class}, app__toast's
// {event_name, data}, ...); each subscriber narrows its own shape, so typing
// this any tighter than `any` would just move the cast to every call site.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler = (arg: any) => void;

class MessageBus {
  private subscribers: Record<string, Array<[Handler, string]>> = {};

  publish(eventName: string, arg?: unknown): void {
    const handlers = this.subscribers[eventName];
    if (handlers) {
      for (let i = 0; i < handlers.length; i++) {
        handlers[i][0](arg);
      }
    }
  }

  subscribe(eventName: string, handler: Handler): string {
    if (!this.subscribers[eventName]) {
      this.subscribers[eventName] = [];
    }
    const subscriptionId = `#${eventName}--${handler.name}--${Math.random().toString().substring(2, 12)}`;
    this.subscribers[eventName].push([handler, subscriptionId]);
    return subscriptionId;
  }

  unsubscribe(eventName: string, subscriptionId: string): void {
    if (this.subscribers[eventName]) {
      const handlerIndex = this.subscribers[eventName].findIndex(
        (entry) => entry[1] === subscriptionId
      );
      if (handlerIndex !== -1) {
        this.subscribers[eventName].splice(handlerIndex, 1);
      }
    }
  }
}

export const messageBus = new MessageBus();
