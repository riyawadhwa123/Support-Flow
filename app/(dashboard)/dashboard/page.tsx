'use client';

import { useState, useEffect } from 'react';
import { MetricCard } from '@/components/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Phone, Clock } from 'lucide-react';

interface DashboardStats {
  totalCalls: number;
  averageDuration: number;
  totalDuration: number;
  successRate: number;
  callsData: Array<{ date: string; calls: number }>;
  successData: Array<{ date: string; rate: number }>;
  topAgents: Array<{ agentId: string; agentName: string; calls: number }>;
  languages: Array<{ language: string; count: number }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching dashboard stats...');
      const response = await fetch('/api/stats?days=30');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Stats loaded successfully:', data);
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stats');
      
      // Set empty stats on error
      setStats({
        totalCalls: 0,
        averageDuration: 0,
        totalDuration: 0,
        successRate: 0,
        callsData: [],
        successData: [],
        topAgents: [],
        languages: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTotalDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Error: {error}</p>
          <button
            onClick={loadStats}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Good afternoon, Anmol</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">My Workspace</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard 
          title="Number of calls" 
          value={stats?.totalCalls.toString() || "0"} 
          icon={Phone} 
        />
        <MetricCard 
          title="Average duration" 
          value={stats ? formatDuration(stats.averageDuration) : "0:00"} 
          icon={Clock} 
        />
        <MetricCard 
          title="Total duration" 
          value={stats ? formatTotalDuration(stats.totalDuration) : "0m"} 
          subtitle="all calls" 
          icon={Clock} 
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Call Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats?.callsData || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs" 
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--background)', 
                    border: '1px solid var(--border)',
                    borderRadius: '0.375rem'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="calls" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">Overall success rate</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="text-3xl font-bold">
                {stats ? `${stats.successRate.toFixed(1)}%` : '0%'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {stats?.totalCalls || 0} total calls
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats?.successData || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--background)', 
                    border: '1px solid var(--border)',
                    borderRadius: '0.375rem'
                  }}
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Widgets */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">Most called agents</CardTitle>
              <span className="text-xs text-gray-500 dark:text-gray-400">Top 5</span>
            </div>
          </CardHeader>
          <CardContent>
            {stats && stats.topAgents.length > 0 ? (
              <div className="space-y-4">
                {stats.topAgents.map((agent, index) => (
                  <div key={agent.agentId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 font-medium text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {agent.agentName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {agent.agentId !== agent.agentName ? agent.agentId.substring(0, 15) + '...' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-2 flex-shrink-0">
                      {agent.calls} {agent.calls === 1 ? 'call' : 'calls'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12 text-center">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-300">No agent data has been collected</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Make some calls to see agent statistics</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Language Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {stats && stats.languages.length > 0 ? (
              <div className="space-y-3">
                {stats.languages.slice(0, 5).map((lang, index) => {
                  const percentage = stats.totalCalls > 0 ? (lang.count / stats.totalCalls) * 100 : 0;
                  return (
                    <div key={lang.language}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {lang.language}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {lang.count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12 text-center">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-300">No language data has been collected</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Language is detected from call transcripts</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

