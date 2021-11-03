import admin from 'firebase-admin'
import serviceAccount from './tocpc-admin.json'
import { exec } from 'child_process'

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://tocpc-prod-2021.firebaseio.com/',
})

const zeroPad = (num, places) => String(num).padStart(places, '0')

let id = 1

const nexec = (cmd, args) => {
  return new Promise((resolve, reject) => {
    exec(cmd + ' ' + args.join(' '), (error, stdout, stderr) => {
      if (error) {
        console.warn(error)
      }
      resolve(stdout ? stdout : stderr)
    })
  })
}

while (true) {
  const data = await admin
    .firestore()
    .collection('users')
    .where('username', '==', 'user' + zeroPad(id, 4))
    .get()
  let cnt = 0
  data.forEach((d) => {
    cnt++
  })
  if (cnt === 0) {
    break
  } else {
    id++
  }
}

admin
  .firestore()
  .collection('users')
  .where('username', '==', '')
  .where('password', '!=', '')
  .limit(1)
  .onSnapshot((docs) => {
    docs.forEach(async (doc) => {
      const uid = doc.id
      const data = doc.data()
      let username = 'user' + zeroPad(id++, 4)
      await nexec('cmsAddUser ', [
        '-H',
        data.password.replaceAll('$', '\\$'),
        '--bcrypt',
        data.firstname,
        data.lastname,
        username,
      ])
      if (data.anonymous) {
        await nexec('cmsAddParticipation', ['--hidden', '-c', '1', username])
        await nexec('cmsAddParticipation', ['--hidden', '-c', '2', username])
        await nexec('cmsAddParticipation', ['--hidden', '-c', '3', username])
      } else {
        await nexec('cmsAddParticipation', ['-c', '1', username])
        await nexec('cmsAddParticipation', ['-c', '2', username])
        await nexec('cmsAddParticipation', ['-c', '3', username])
      }
      console.log('exec on user:', username)
      admin.firestore().doc(`users/${uid}`).update({ username })
    })
  })
