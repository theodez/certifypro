import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { CheckCheck, ClockAlert, X } from "lucide-react";

// Mock data for certifications
const certificationData = [
  { name: "Actives", value: 42, color: "#10b981", icon: CheckCheck },
  { name: "Bientôt expirées", value: 15, color: "#f59e0b", icon: ClockAlert },
  { name: "Expirées", value: 8, color: "#ef4444", icon: X },
];

// Custom Legend component
const CustomLegend = (props: any) => {
  const { payload } = props;
  
  return (
    <ul className="flex flex-col gap-2 text-sm mt-4">
      {payload.map((entry: any, index: number) => {
        const IconComponent = certificationData[index].icon;
        return (
          <li key={`item-${index}`} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <IconComponent size={16} className="text-muted-foreground" />
            <span>
              <strong>{entry.value}</strong> {entry.name}
            </span>
          </li>
        );
      })}
    </ul>
  );
};

// Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover text-popover-foreground shadow-lg rounded-lg p-3 text-sm animate-fade-in">
        <p className="font-semibold">{`${payload[0].name}: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const CertificationsChart = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <Card className="shadow-lg h-full animate-scale-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold">Statut des Certifications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full flex items-center justify-center">
          {isClient ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={certificationData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={800}
                  animationBegin={300}
                >
                  {certificationData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      stroke="none"
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  content={<CustomLegend />}
                  verticalAlign="bottom" 
                  align="center"
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full w-full">
              <div className="h-40 w-40 rounded-full border-4 border-muted-foreground/10 border-t-primary animate-spin"></div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CertificationsChart;
