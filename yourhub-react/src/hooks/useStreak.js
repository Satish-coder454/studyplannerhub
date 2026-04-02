import { useState, useEffect, useCallback } from 'react'
import { apiRequest } from '../api'

export default function useStreak() {
  const [streak, setStreak] = useState({ count: 0, lastCompletedDate: null })

  // Validate streak on mount
  useEffect(() => {
    if (!localStorage.getItem('token')) return
    
    apiRequest('/streak').then(data => {
      const today = new Date().toDateString()
      if (!data.lastCompletedDate) {
        setStreak({ count: data.streakCount || 0, lastCompletedDate: null })
        return
      }
      const last = new Date(data.lastCompletedDate)
      if (isNaN(last)) { 
        setStreak({ count: 0, lastCompletedDate: null })
        apiRequest('/streak', { method: 'POST', body: JSON.stringify({ streakCount: 0, lastCompletedDate: null }) })
        return 
      }
      const diff = Math.round(Math.abs((new Date() - last) / 86400000))
      if (diff > 1 && last.toDateString() !== today) {
        setStreak({ count: 0, lastCompletedDate: null })
        apiRequest('/streak', { method: 'POST', body: JSON.stringify({ streakCount: 0, lastCompletedDate: null }) })
      } else {
        setStreak({ count: data.streakCount, lastCompletedDate: data.lastCompletedDate })
      }
    }).catch(console.error)
  }, [])

  const updateStreak = useCallback(() => {
    const today = new Date().toDateString()
    setStreak(prev => {
      let newCount = 1
      if (prev.lastCompletedDate) {
        const last = new Date(prev.lastCompletedDate)
        if (last.toDateString() === today) return prev
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
        newCount = last.toDateString() === yesterday.toDateString() ? prev.count + 1 : 1
      }
      const newState = { streakCount: newCount, lastCompletedDate: today }
      apiRequest('/streak', { method: 'POST', body: JSON.stringify(newState) }).catch(console.error)
      return { count: newCount, lastCompletedDate: today }
    })
  }, [])

  return [streak.count, updateStreak]
}
