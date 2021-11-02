import admin from 'firebase-admin'
import serviceAccount from './tocpc-admin.json'
import { exec } from 'child_process'

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://tocpc-prod-2021.firebaseio.com/"  
})

const zeroPad = (num, places) => String(num).padStart(places, '0')

let id = 1

admin.firestore()
  .collection("users")
  .where("username", "==", "")
  .where("password", "!=", "")
  .limit(1)
  .onSnapshot((docs) => {
    docs.forEach((doc) => {
      const uid = doc.id
      const data = doc.data()
      let username = "user" + zeroPad(id++, 3)
      exec("cmsAddUser", ["-H", "--bcrypt", ""])
      admin.firestore().doc(`users/${uid}`).update({ username })
    })
  })


