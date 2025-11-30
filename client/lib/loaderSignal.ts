// Simple event bus to control the loader from anywhere (Axios, Hooks, etc.)
type LoaderEvent = 'start' | 'stop' | 'complete';
type Listener = (event: LoaderEvent) => void;

let listeners: Listener[] = [];

export const loaderState = {
  start: () => notify('start'),
  stop: () => notify('stop'),
  complete: () => notify('complete'),
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
};

const notify = (event: LoaderEvent) => {
  listeners.forEach((l) => l(event));
};
