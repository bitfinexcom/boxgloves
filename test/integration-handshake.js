'use strict'

/* eslint-env mocha */

process.env.DEBUG = '*'

const assert = require('assert')
const utp = require('utp-native')
const debug = require('debug')('holepunch')

const Holepuncher = require('../')

function newHp (socket) {
  const cacheOpts = { max: 500, maxAge: 1000 * 3 }

  const opts = {
    handshakes: cacheOpts,
    min: 2,
    max: 5,
    delay: 50,
    control: 'ÿ'
  }

  return new Holepuncher(socket, opts).register()
}

function getNewBoundSocket () {
  const u = utp()
  u.bind(0)
  return u
}

describe('handshaked holepunch', () => {
  it('emits a handshake after max 5 sends', (done) => {
    const hp1 = newHp(getNewBoundSocket())
    const hp2 = newHp(getNewBoundSocket())

    let count = 0

    debug('sock 1 on', hp1.whoami())
    debug('sock 2 on', hp2.whoami())

    hp1.enableHandshake()
    hp2.enableHandshake()

    hp1.handshake(hp2.whoami())
    hp2.handshake(hp1.whoami())

    hp1.on('punched', () => {
      count++
    })

    let h1 = false
    let h2 = false
    hp1.on('handshake', () => {
      assert.ok(count < 5)
      h1 = true

      if (h1 && h2) finish()
    })

    hp2.on('handshake', () => {
      assert.ok(count < 5)
      h2 = true

      if (h1 && h2) finish()
    })

    function finish () {
      hp1.close()
      hp2.close()
      done()
    }
  })
})
