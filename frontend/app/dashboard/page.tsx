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

        <Card>
          <CardHeader>
            <CardTitle>Módulos</CardTitle>
            <CardDescription>
              Accede a los diferentes módulos del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2"
                onClick={() => router.push("/dashboard/drivers")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="font-semibold">Choferes</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2"
                disabled
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                  />
                </svg>
                <span className="font-semibold">Camiones</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2"
                disabled
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <span className="font-semibold">Operaciones</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
