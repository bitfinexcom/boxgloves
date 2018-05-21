'use strict'

/* eslint-env mocha */

process.env.DEBUG = '*'

const assert = require('assert')
const utp = require('utp-native')
const debug = require('debug')('holepunch')

const Holepuncher = require('../')

function newHp (socket) {
  const cacheOpts = { max: 500, maxAge: 1000 * 60 * 3 }

  const opts = {
    handshakes: cacheOpts,
    min: 2,
    max: 3,
    control: 'ÿ'
  }

  return new Holepuncher(socket, opts).register()
}

function getNewBoundSocket () {
  const u = utp()
  u.bind(0)
  return u
}

describe('basic holepunch', () => {
  it('emits punched events', (done) => {
    const hp1 = newHp(getNewBoundSocket())
    const hp2 = newHp(getNewBoundSocket())

    debug('sock 1 on', hp1.whoami())
    debug('sock 2 on', hp2.whoami())

    hp2.on('punched', (other) => {
      hp2.punch(other)
    })

    hp1.on('punched', () => {
      hp1.close()
      hp2.close()
      done()
    })

    hp1.punch(hp2.whoami())
  })

  it('other messages do not emit a punched event', (done) => {
    const hp1 = newHp(getNewBoundSocket())
    const hp2 = newHp(getNewBoundSocket())

    debug('sock 1 on', hp1.whoami())
    debug('sock 2 on', hp2.whoami())

    hp2.on('punched', (other) => {
      assert.fail('punched')
    })

    hp1.on('punched', () => {
      assert.fail('punched')
    })

    // send some random other stuff
    hp1.send(Buffer.from('{"foo":"bar"}'), hp2.whoami())
    hp1.send(Buffer.from('blerg'), hp2.whoami())
    hp1.send(Buffer.from('pineapple'), hp2.whoami())

    setTimeout(() => {
      hp1.close()
      hp2.close()
      done()
    }, 500)
  })

  it('other messages emit a "msg" event', (done) => {
    const hp1 = newHp(getNewBoundSocket())
    const hp2 = newHp(getNewBoundSocket())

    debug('sock 1 on', hp1.whoami())
    debug('sock 2 on', hp2.whoami())

    hp2.on('punched', (other) => {
      assert.fail('punched')
    })

    hp1.on('punched', () => {
      assert.fail('punched')
    })

    let count = 0
    hp2.on('msg', (msg, rinfo) => {
      count++

      if (count === 3) {
        assert.strictEqual(msg.toString(), 'pineapple')
        assert.strictEqual(rinfo.port, hp1.whoami().port)

        hp1.close()
        hp2.close()
        done()
        return
      }
    })

    // send some random other stuff
    hp1.send(Buffer.from('{"foo":"bar"}'), hp2.whoami())
    hp1.send(Buffer.from('blerg'), hp2.whoami())
    hp1.send(Buffer.from('pineapple'), hp2.whoami())
  })
})
