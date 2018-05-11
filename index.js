'use strict'

const Events = require('events')
const assert = require('assert')

const debug = require('debug')('holepunch')
const LRU = require('lru-cache')

class Holepuncher extends Events {
  constructor (socket, opts) {
    super()

    assert.ok(socket, 'required: socket')

    this.opts = opts
    this.socket = socket
    this.punchCard = LRU(opts.cacheOpts)

    if (!this.opts.controlBuf) {
      this.opts.controlBuf = Buffer.from(this.opts.control)
    }
  }

  register () {
    this.socket.on('message', (msg, rinfo) => {
      if (!msg.equals(this.opts.controlBuf)) return

      debug('received control char ', this.opts.controlBuf, ' for punching from', rinfo)
      this.emit('punched', rinfo)
    })

    return this
  }

  close () {
    this.socket.close()
  }

  whoami () {
    const { address, port } = this.socket.address()
    return { address, port }
  }

  punch (target, cb = () => {}) {
    const buf = this.opts.controlBuf

    this.send(buf, target.port, target.address)

    return this
  }

  send (buf, port, address) {
    debug(`this.socket.send(${buf}, 0, ${buf.length}, ${port}, ${address})`)
    this.socket.send(buf, 0, buf.length, port, address)
  }
}

module.exports = Holepuncher
