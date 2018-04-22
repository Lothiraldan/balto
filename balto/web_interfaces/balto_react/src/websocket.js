export const socket = new WebSocket("ws://localhost:8888");

socket.onopen = () => {
  let data = { jsonrpc: "2.0", id: 0, method: "subscribe", params: "test" };
  socket.send(JSON.stringify(data));
};
