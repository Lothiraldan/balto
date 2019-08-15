export const socket = new WebSocket("ws://localhost:8889/ws");

socket.onopen = () => {
  console.debug("ON OPEN");
  let data = { jsonrpc: "2.0", id: 0, method: "subscribe", params: "test" };
  socket.send(JSON.stringify(data));
};
