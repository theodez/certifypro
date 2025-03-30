"use client"

import { Card } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

interface Team {
  id: string;
  name: string;
  validCount: number;
  warningCount: number;
  expiredCount: number;
  complianceRate: number;
  members: any[];
}

interface ChartData {
  name: string;
  "À jour": number;
  "En attente": number;
  "Expiré": number;
}

const defaultData = [
  {
    name: "Équipe A",
    "À jour": 80,
    "En attente": 15,
    "Expiré": 5,
  },
  {
    name: "Équipe B",
    "À jour": 75,
    "En attente": 20,
    "Expiré": 5,
  },
  {
    name: "Équipe C",
    "À jour": 90,
    "En attente": 10,
    "Expiré": 0,
  },
  {
    name: "Équipe D",
    "À jour": 85,
    "En attente": 10,
    "Expiré": 5,
  },
]

export function TrainingStatusChart({ teamsData = [] }: { teamsData?: Team[] }) {
  // Transform teamsData into chart format
  const chartData: ChartData[] = teamsData.length > 0 
    ? teamsData.slice(0, 6).map(team => {
        const total = team.validCount + team.warningCount + team.expiredCount;
        // If total is 0, show 100% valid to avoid division by zero
        const validPercent = total === 0 ? 100 : Math.round((team.validCount / total) * 100);
        const warningPercent = total === 0 ? 0 : Math.round((team.warningCount / total) * 100);
        const expiredPercent = total === 0 ? 0 : Math.round((team.expiredCount / total) * 100);
        
        return {
          name: team.name,
          "À jour": validPercent,
          "En attente": warningPercent,
          "Expiré": expiredPercent
        };
      })
    : defaultData;

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip />
        <Bar
          dataKey="À jour"
          fill="hsl(var(--chart-1))"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="En attente"
          fill="hsl(var(--chart-2))"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="Expiré"
          fill="hsl(var(--chart-3))"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}