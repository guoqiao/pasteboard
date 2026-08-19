/**
 * Socket connection module, primarily used to
 * detect when a user leaves the page
 */

let ID = false;

const socketConnection = (pasteboard: any) => {
  const self = {
    isSupported: () => !!window.WebSocket,
    getID: () => ID,
    init: () => {
      if (!self.isSupported()) return;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const connection = new WebSocket(`${protocol}//${window.location.host}`);
      connection.onmessage = (e: any) => {
        let data: any;
        try {
          data = JSON.parse(e.data);
        } catch (err) {
          data = e.data;
        }

        if (!ID && data.id) {
          ID = data.id;
          $(self).trigger("idReceive");
        } else {
          log(e.data);
        }
      };
    },
  };

  return self;
};

window.moduleLoader.addModule("socketConnection", socketConnection);