# boxgloves

Simple UTP holepunch helper

## Examples

See [/examples/](/examples/)

## API

### new Boxgloves(socket, opts)

Creates new instance, takes an existing, bound socket.

```js
const opts = {
  handshakes: cacheOpts,
  min: 2,
  max: 5,
  delay: 50,
  control: 'ÿ'
}

return new Holepuncher(socket, opts).register()
```

Options:

  - `control`: character send to filter out holepunche packets
  - `handshakes`: cache options for handshake target table
  - `delay`: delay between sending UTP packets to target in case of handshake
  - `min`: min packets to receive for successful handshake
  - `max`: max packets to send for a handshake with a target


### register

Needed to use the boxgloves instance. Wraps the socket with additional event/message handling.

### punch(target)

Sends a UTP packet to target. Target is an object containing port and address.

The content of the packet is a control character. Default: `ÿ`

Example:

```js
hp.punch({ address: '127.0.0.1', port: 12345 })
```

### whoami()

Returns address and port as an object from current socket

### event: punched - emits: target/ info

Emitted on receiving a control character. Emits the senders ip/port as object.

### enableHandshake()

Enable handshake functionality

### handshake(target)

Will send a pre-defined number of maximum packets to a target (default: `5`).
Additionally listens for 30secs for any received packets.
If the minimum value of received packets is reached (default: `2`), a `handshake` event is emitted.

### event: handshake - emits: target/ info

Emitted after a successful handshake.
