'use strict'

process.env.DEBUG = '*'

const utp = require('utp-native')
const debug = require('debug')('holepunch-demo')

const Holepuncher = require('../')

function newHp (socket) {
  const cacheOpts = { max: 500, maxAge: 1000 * 60 * 3 }

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

const hp1 = newHp(getNewBoundSocket())
const hp2 = newHp(getNewBoundSocket())

debug('sock 1 on', hp1.whoami())
debug('sock 2 on', hp2.whoami())

hp2.on('punched', (other) => {
  debug('received punch from', other)
  hp2.punch(other)
})

hp1.on('punched', (other) => {
  debug('received punch from', other)

  // cleanup
  hp1.close()
  hp2.close()
})

hp1.punch(hp2.whoami())
