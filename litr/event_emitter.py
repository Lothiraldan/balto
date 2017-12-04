import asyncio


class EventEmitter(object):
    def __init__(self, loop):
        self.callbacks = []
        self.loop = loop

    def register(self, callback):
        self.callbacks.append(callback)

    async def emit(self, event):
        awaitables = []
        for callback in self.callbacks:
            # Don't wait for callbacks to finished
            awaitables.append(callback(event))

        # Wait for callbacks in parallel
        await asyncio.gather(*awaitables)
