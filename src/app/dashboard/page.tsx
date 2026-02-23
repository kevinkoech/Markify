import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { submissions, results, units, users } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { StatCard } from "@/components/stat-card";
import { RecentSubmissions } from "@/components/recent-submissions";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  // Fetch stats based on role
  let stats = {
    totalSubmissions: 0,
    pendingMarking: 0,
    completedToday: 0,
    averageScore: 0,
  };

  let recentSubmissions: any[] = [];

  if (user.role === "trainee") {
    // Trainee stats
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(submissions)
      .where(eq(submissions.traineeId, user.id));
    
    const [pendingResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(submissions)
      .where(and(
        eq(submissions.traineeId, user.id),
        sql`${submissions.status} IN ('uploaded', 'waiting', 'marking')`
      ));
    
    const [avgResult] = await db
      .select({ avg: sql<number>`avg(percentage)` })
      .from(results)
      .where(eq(results.traineeId, user.id));

    stats = {
      totalSubmissions: totalResult?.count || 0,
      pendingMarking: pendingResult?.count || 0,
      completedToday: 0,
      averageScore: Math.round(avgResult?.avg || 0),
    };

    // Recent submissions for trainee
    recentSubmissions = await db
      .select({
        id: submissions.id,
        fileName: submissions.originalFileName,
        status: submissions.status,
        uploadedAt: submissions.uploadedAt,
        unitName: units.name,
        score: results.percentage,
      })
      .from(submissions)
      .leftJoin(units, eq(submissions.unitId, units.id))
      .leftJoin(results, eq(submissions.id, results.submissionId))
      .where(eq(submissions.traineeId, user.id))
      .orderBy(desc(submissions.uploadedAt))
      .limit(5);

  } else if (user.role === "trainer" || user.role === "admin") {
    // Trainer/Admin stats
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(submissions);
    
    const [pendingResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(submissions)
      .where(sql`${submissions.status} IN ('uploaded', 'waiting', 'marking')`);
    
    const [completedTodayResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(submissions)
      .where(and(
        eq(submissions.status, "marked"),
        sql`date(${submissions.markedAt}) = date('now')`
      ));
    
    const [avgResult] = await db
      .select({ avg: sql<number>`avg(percentage)` })
      .from(results);

    stats = {
      totalSubmissions: totalResult?.count || 0,
      pendingMarking: pendingResult?.count || 0,
      completedToday: completedTodayResult?.count || 0,
      averageScore: Math.round(avgResult?.avg || 0),
    };

    // Recent submissions for trainer/admin
    recentSubmissions = await db
      .select({
        id: submissions.id,
        fileName: submissions.originalFileName,
        status: submissions.status,
        uploadedAt: submissions.uploadedAt,
        unitName: units.name,
        traineeName: users.name,
        score: results.percentage,
      })
      .from(submissions)
      .leftJoin(units, eq(submissions.unitId, units.id))
      .leftJoin(users, eq(submissions.traineeId, users.id))
      .leftJoin(results, eq(submissions.id, results.submissionId))
      .orderBy(desc(submissions.uploadedAt))
      .limit(5);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user.name}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Submissions"
          value={stats.totalSubmissions}
          icon="folder"
          color="blue"
        />
        <StatCard
          title="Pending Marking"
          value={stats.pendingMarking}
          icon="clock"
          color="yellow"
        />
        <StatCard
          title="Completed Today"
          value={stats.completedToday}
          icon="check"
          color="green"
        />
        <StatCard
          title="Average Score"
          value={`${stats.averageScore}%`}
          icon="chart"
          color="indigo"
        />
      </div>

      {/* Recent Submissions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Submissions</h2>
        </div>
        <RecentSubmissions submissions={recentSubmissions} userRole={user.role} />
      </div>
    </div>
  );
}
