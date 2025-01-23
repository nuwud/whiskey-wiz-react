"use client";

import { useEffect, useState } from 'react'
import { Switch } from '@/components/ui/switch-ui.component'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-ui.component'
import { doc, updateDoc, collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase'

interface Feature {
  id: string
  name: string
  description: string
  enabled: boolean
  requiresRefresh: boolean
  category: string
}

export function FeatureToggleAdmin() {
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const featuresRef = collection(db, 'features')
    const unsubscribe = onSnapshot(featuresRef, (snapshot) => {
      const featureData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Feature[]
      setFeatures(featureData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleToggle = async (id: string, enabled: boolean) => {
    const featureRef = doc(db, 'features', id)
    await updateDoc(featureRef, { enabled })
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="grid gap-4">
      {features.map(feature => (
        <Card key={feature.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{feature.name}</span>
              <Switch
                checked={feature.enabled}
                onCheckedChange={(checked) => handleToggle(feature.id, checked)}
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{feature.description}</p>
            {feature.requiresRefresh && (
              <p className="text-sm text-amber-600 mt-2">
                * Changes require game refresh
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}