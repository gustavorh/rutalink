"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUser, isAuthenticated, logout } from "@/lib/auth";
import type { AuthResponse } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [user] = useState<AuthResponse["user"] | null>(() => {
    // Initialize state from localStorage on first render
    return getUser();
  });

  useEffect(() => {
    // Check authentication on mount
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    logout();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              Welcome, {user.firstName} {user.lastName}!
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Username</p>
                <p className="text-lg">{user.username}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Email</p>
                <p className="text-lg">{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">User ID</p>
                <p className="text-lg">{user.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Operator ID
                </p>
                <p className="text-lg">{user.operatorId}</p>
              </div>
              {user.operator && (
                <>
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Operator
                    </p>
                    <p className="text-lg">{user.operator.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Super User
                    </p>
                    <p className="text-lg">
                      {user.operator.super ? "Yes" : "No"}
                    </p>
                  </div>
                </>
              )}
              {user.role && (
                <div>
                  <p className="text-sm font-medium text-slate-500">Role</p>
                  <p className="text-lg">{user.role.name}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
