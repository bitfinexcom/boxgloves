'use strict'

const Events = require('events')
const assert = require('assert')

const debug = require('debug')('holepunch')
const LRU = require('lru-cache')

function getCacheKey (target) {
  if (target.address === '0.0.0.0') target.address = '127.0.0.1'

  return target.address + ':' + target.port
}

class Holepuncher extends Events {
  constructor (socket, opts) {
    super()

    assert.ok(socket, 'required: socket')

    this.opts = opts
    this.socket = socket
    this.punchCard = LRU(opts.handshakes)
    this.handshakes = LRU(opts.handshakes)
    this.handshakeEnabled = false

    if (!this.opts.control) {
      this.opts.control = 'ÿ'
    }
    if (!this.opts.controlBuf) {
      this.opts.controlBuf = Buffer.from(this.opts.control)
    }
  }

  isHolepunch (msg) {
    return msg.equals(this.opts.controlBuf)
  }

  enableHandshake () {
    this.handshakeEnabled = true
  }

  register () {
    this.socket.on('message', (msg, rinfo) => {
      if (!this.isHolepunch(msg)) {
        this.emit('msg', msg, rinfo)
        return
      }
      // debug('received control char ', this.opts.controlBuf, ' for punching from', rinfo)

      if (this.handshakeEnabled) {
        this.addPunchToCache('recv', rinfo)
        if (this.isHandshakeFinished(rinfo)) {
          this.finishHandshake(rinfo)
        }
      }

      this.emit('punched', rinfo)
    })

    return this
  }

  finishHandshake (rinfo) {
    const k = getCacheKey(rinfo)

    clearTimeout(this.handshakes.get(k))

    this.handshakes.del(k)
    this.emit('handshake', rinfo)
  }

  addPunchToCache (type, rinfo) {
    const k = getCacheKey(rinfo)
    let el = this.punchCard.get(k)

    if (!el) {
      el = {
        recv: 0,
        send: 0
      }
    }

    el[type]++
    this.punchCard.set(k, el)
  }

  getPunchesFromCache (target) {
    const k = getCacheKey(target)
    let el = this.punchCard.get(k)

    if (!el) {
      el = {
        recv: 0,
        send: 0
      }

      this.punchCard.set(k, el)
    }

    return el
  }

  close () {
    this.socket.close()
  }

  whoami () {
    const { address, port } = this.socket.address()
    return { address, port }
  }

  punch (target) {
    const buf = this.opts.controlBuf

    this.send(buf, target)

    return this
  }

  send (buf, target) {
    debug(`this.socket.send(${buf}, 0, ${buf.length}, ${target.port}, ${target.address})`)

    this.addPunchToCache('send', target)
    this.socket.send(buf, 0, buf.length, target.port, target.address)
  }

  isSendingFinished (target) {
    const data = this.getPunchesFromCache(target)

    if (data.send >= this.opts.max) {
      debug(data.send, '>=', this.opts.max, 'send punches finished')
      return true
    }

    return false
  }

  isHandshakeFinished (target) {
    const data = this.getPunchesFromCache(target)
    let sFinished = false
    let rFinished = false

    sFinished = this.isSendingFinished(target)

    if (data.recv >= this.opts.min) {
      debug(data.recv, '>=', this.opts.min, 'received punches ready')
      rFinished = true
    }

    return sFinished && rFinished
  }

  maybePunch (target) {
    const isFinished = this.isHandshakeFinished(target)

    if (isFinished) {
      this.finishHandshake(target)
      return
    }

    if (this.isSendingFinished(target)) {
      return
    }

    this.punch(target)
  }

  handshake (target) {
    const k = getCacheKey(target)

    if (this.handshakes.peek(k)) {
      return this.emit('error', new Error('handshake already running'))
    }

    const timer = setTimeout(() => {
      this.emit('error', new Error('handshake timed out'))
    }, 30000)

    this.handshakes.set(k, timer)

    const punches = new Array(this.opts.max).fill(() => {
      this.maybePunch(target)
    })

    const _p = (acc) => {
      if (!acc.length) return

      const punch = acc.pop()
      punch()

      setTimeout(() => {
        _p(acc)
      }, this.opts.delay)
    }

    _p(punches)
  }
}

module.exports = Holepuncher
