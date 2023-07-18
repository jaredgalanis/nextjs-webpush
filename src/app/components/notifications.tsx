'use client'

import { useEffect, useState } from 'react'
import styles from '../page.module.css'
import { CONFIG } from '@/config'
import Link from 'next/link'

export default function Notifications() {
  const [permission, setPermission] = useState(Notification.permission)

  const requestPermission = async () => {
    const receivedPermission = await Notification.requestPermission()
    setPermission(receivedPermission)

    if (receivedPermission === 'granted') {
      subscribe()
    }
  }

  const sendNewLocalNotification = () => {
    if (permission !== 'granted') {
      return
    }

    new Notification('Local notification!')
  }

  return (
    <>
      <h3 className={styles.heading}>
        Notifications permission status: {permission}
      </h3>
      <button onClick={requestPermission} className={styles.button}>
        Request permission and subscribe
      </button>
      <button onClick={sendNewLocalNotification} className={styles.button}>
        Local Notification
      </button>
      <Link href="/debug">Debug options</Link>
    </>
  )
}

const registerServiceWorker = async () => {
  return navigator.serviceWorker.register('/service.js')
}

const subscribe = async () => {
  const swRegistration = await registerServiceWorker()

  try {
    const applicationServerKey = urlB64ToUint8Array(CONFIG.PUBLIC_KEY)
    const options = { applicationServerKey, userVisibleOnly: true }
    const subscription = await swRegistration.pushManager.subscribe(options)

    await saveSubscription(subscription)

    console.log({ subscription })
  } catch (err) {
    console.error('Error', err)
  }
}

// encode the base64 public key to Array buffer
const urlB64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

const saveSubscription = async (subscription: PushSubscription) => {
  const ORIGIN = window.location.origin
  const BACKEND_URL = `${ORIGIN}/api/push`

  const response = await fetch(BACKEND_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(subscription),
  })
  return response.json()
}
