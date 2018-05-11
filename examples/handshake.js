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

let count1 = 0
let count2 = 0

debug('sock 1 on', hp1.whoami())
debug('sock 2 on', hp2.whoami())

hp1.enableHandshake()
hp2.enableHandshake()

hp1.handshake(hp2.whoami())
hp2.handshake(hp1.whoami())

hp1.on('punched', () => {
  count1++
})

hp1.on('punched', () => {
  count2++
})

hp1.on('handshake', (other) => {
  debug('handshake finished - hp 1 received', count1, 'punches from', other)
})

hp2.on('handshake', (other) => {
  debug('handshake finished - hp 2 received', count2, 'punches from', other)
})
