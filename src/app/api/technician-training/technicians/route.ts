import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const technicians = await prisma.technicianTraining.groupBy({
      by: ['technician'],
      where: {
        companyId: session.user.companyId
      },
      _count: {
        id: true
      },
      orderBy: {
        technician: 'asc'
      }
    });

    const formattedTechnicians = technicians.map(tech => ({
      technician: tech.technician,
      trainingCount: tech._count.id
    }));

    return NextResponse.json(formattedTechnicians);
  } catch (error) {
    console.error("Error fetching technician counts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 