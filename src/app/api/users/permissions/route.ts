import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Allow admin to fetch any, or user to fetch their own
    if (
      session.user.privilege !== "admin" &&
      userId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get the target user to verify they're in the same company
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        companyId: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.companyId !== session.user.companyId) {
      return NextResponse.json({ error: "User not in your company" }, { status: 403 });
    }

    // Get or create user permissions
    let userPermissions = await prisma.userPermission.findUnique({
      where: { userId },
    });

    if (!userPermissions) {
      // Create default permissions for the user
      userPermissions = await prisma.userPermission.create({
        data: {
          userId,
          companyId: session.user.companyId,
          canViewFlightRecords: true,
          canAddFlightRecords: true,
          canExportFlightRecords: false,
          canEditFlightRecords: false,
          canExportPdfFlightRecords: true,
          canDeleteFlightRecords: false,
          canViewStockInventory: true,
          canGenerateStockReport: true,
          canAddStockItem: false,
          canGenerateStockPdf: true,
          canDeleteStockRecord: false,
          canViewIncomingInspections: true,
          canAddIncomingInspections: false,
          canDeleteIncomingInspections: false,
          canConfigureTemperatureRanges: false,
          canAddTemperatureRecord: false,
          canDeleteTemperatureRecord: false,
          canSeeAuditManagement: false,
        },
      });
    } else {
      // Update existing permissions to include new fields if they don't exist
      const needsUpdate = userPermissions.canViewStockInventory === undefined ||
                         userPermissions.canGenerateStockReport === undefined || 
                         userPermissions.canAddStockItem === undefined ||
                         userPermissions.canGenerateStockPdf === undefined ||
                         userPermissions.canDeleteStockRecord === undefined ||
                         userPermissions.canViewIncomingInspections === undefined ||
                         userPermissions.canAddIncomingInspections === undefined ||
                         userPermissions.canDeleteIncomingInspections === undefined ||
                         userPermissions.canSeeAuditManagement === undefined;
      
      if (needsUpdate) {
        userPermissions = await prisma.userPermission.update({
          where: { userId },
          data: {
            canViewStockInventory: userPermissions.canViewStockInventory ?? true,
            canGenerateStockReport: userPermissions.canGenerateStockReport ?? true,
            canAddStockItem: userPermissions.canAddStockItem ?? false,
            canGenerateStockPdf: userPermissions.canGenerateStockPdf ?? true,
            canDeleteStockRecord: userPermissions.canDeleteStockRecord ?? false,
            canViewIncomingInspections: userPermissions.canViewIncomingInspections ?? true,
            canAddIncomingInspections: userPermissions.canAddIncomingInspections ?? false,
            canDeleteIncomingInspections: userPermissions.canDeleteIncomingInspections ?? false,
            canSeeAuditManagement: userPermissions.canSeeAuditManagement ?? false,
          },
        });
      }
    }

    return NextResponse.json({
      user: targetUser,
      permissions: userPermissions,
    });
  } catch (error) {
    console.error("[GET] /api/users/permissions error:", error);
    return NextResponse.json({ 
      error: "Failed to get user permissions",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 });
    }

    if (session.user.privilege !== "admin") {
      return NextResponse.json({ error: "Unauthorized - Not admin" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      userId, 
      canViewFlightRecords, 
      canAddFlightRecords, 
      canExportFlightRecords,
      canEditFlightRecords,
      canExportPdfFlightRecords,
      canDeleteFlightRecords,
      canViewStockInventory,
      canGenerateStockReport,
      canAddStockItem,
      canGenerateStockPdf,
      canDeleteStockRecord,
      canViewIncomingInspections,
      canAddIncomingInspections,
      canDeleteIncomingInspections,
      canConfigureTemperatureRanges,
      canAddTemperatureRecord,
      canDeleteTemperatureRecord,
      canSeeAuditManagement
    } = body;

    // Validate input
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Get the target user to verify they're in the same company
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        companyId: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.companyId !== session.user.companyId) {
      return NextResponse.json({ error: "User not in your company" }, { status: 403 });
    }

    // Prevent changing own permissions
    if (userId === session.user.id) {
      return NextResponse.json({ error: "Cannot change your own permissions" }, { status: 400 });
    }

    // Update or create user permissions
    const updatedPermissions = await prisma.userPermission.upsert({
      where: { userId },
      update: {
        canViewFlightRecords: canViewFlightRecords ?? true,
        canAddFlightRecords: canAddFlightRecords ?? true,
        canExportFlightRecords: canExportFlightRecords ?? false,
        canEditFlightRecords: canEditFlightRecords ?? false,
        canExportPdfFlightRecords: canExportPdfFlightRecords ?? true,
        canDeleteFlightRecords: canDeleteFlightRecords ?? false,
        canViewStockInventory: canViewStockInventory ?? true,
        canGenerateStockReport: canGenerateStockReport ?? true,
        canAddStockItem: canAddStockItem ?? false,
        canGenerateStockPdf: canGenerateStockPdf ?? true,
        canDeleteStockRecord: canDeleteStockRecord ?? false,
        canViewIncomingInspections: canViewIncomingInspections ?? true,
        canAddIncomingInspections: canAddIncomingInspections ?? false,
        canDeleteIncomingInspections: canDeleteIncomingInspections ?? false,
        canConfigureTemperatureRanges: canConfigureTemperatureRanges ?? false,
        canAddTemperatureRecord: canAddTemperatureRecord ?? false,
        canDeleteTemperatureRecord: canDeleteTemperatureRecord ?? false,
        canSeeAuditManagement: canSeeAuditManagement ?? false,
      },
      create: {
        userId,
        companyId: session.user.companyId,
        canViewFlightRecords: canViewFlightRecords ?? true,
        canAddFlightRecords: canAddFlightRecords ?? true,
        canExportFlightRecords: canExportFlightRecords ?? false,
        canEditFlightRecords: canEditFlightRecords ?? false,
        canExportPdfFlightRecords: canExportPdfFlightRecords ?? true,
        canDeleteFlightRecords: canDeleteFlightRecords ?? false,
        canViewStockInventory: canViewStockInventory ?? true,
        canGenerateStockReport: canGenerateStockReport ?? true,
        canAddStockItem: canAddStockItem ?? false,
        canGenerateStockPdf: canGenerateStockPdf ?? true,
        canDeleteStockRecord: canDeleteStockRecord ?? false,
        canViewIncomingInspections: canViewIncomingInspections ?? true,
        canAddIncomingInspections: canAddIncomingInspections ?? false,
        canDeleteIncomingInspections: canDeleteIncomingInspections ?? false,
        canConfigureTemperatureRanges: canConfigureTemperatureRanges ?? false,
        canAddTemperatureRecord: canAddTemperatureRecord ?? false,
        canDeleteTemperatureRecord: canDeleteTemperatureRecord ?? false,
        canSeeAuditManagement: canSeeAuditManagement ?? false,
      },
    });

    // Log the activity
    await logActivity({
      userId: session.user.id,
      action: "UPDATED_USER",
      resourceType: "USER",
      resourceId: userId,
      resourceTitle: `Updated permissions for ${targetUser.firstName} ${targetUser.lastName}`,
      metadata: {
        userId,
        permissions: updatedPermissions,
        updatedBy: session.user.id,
      },
    });

    return NextResponse.json({
      message: "Permissions updated successfully",
      permissions: updatedPermissions,
    });
  } catch (error) {
    console.error("[PATCH] /api/users/permissions error:", error);
    return NextResponse.json({ 
      error: "Failed to update permissions",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 