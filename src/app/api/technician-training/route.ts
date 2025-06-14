import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { uploadTechnicianTrainingFile } from "@/lib/s3";

// Validation schema for training data
const trainingSchema = z.object({
  date: z.string().transform(str => new Date(str)),
  technician: z.string().min(1),
  organization: z.string(),
  customOrg: z.string().optional(),
  type: z.string(),
  customType: z.string().optional(),
  training: z.string().min(1),
  hasEngine: z.boolean(),
  engineType: z.string().optional(),
  hasHours: z.boolean(),
  hours: z.number().optional(),
  hasComment: z.boolean(),
  comment: z.string().optional(),
  hasAttachments: z.boolean(),
  attachments: z.array(z.any()).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const data = Object.fromEntries(formData.entries());
    
    // Parse and validate the data
    const validatedData = trainingSchema.parse({
      ...data,
      hasEngine: data.hasEngine === "true",
      hasHours: data.hasHours === "true",
      hasComment: data.hasComment === "true",
      hasAttachments: data.hasAttachments === "true",
      hours: data.hours ? parseFloat(data.hours as string) : undefined,
      attachments: formData.getAll("attachments"),
    });

    // Create the training record
    const training = await prisma.technicianTraining.create({
      data: {
        companyId: session.user.companyId,
        date: validatedData.date,
        technician: validatedData.technician,
        organization: validatedData.organization,
        customOrg: validatedData.customOrg,
        type: validatedData.type,
        customType: validatedData.customType,
        training: validatedData.training,
        hasEngine: validatedData.hasEngine,
        engineType: validatedData.engineType,
        hasHours: validatedData.hasHours,
        hours: validatedData.hours,
        hasComment: validatedData.hasComment,
        comment: validatedData.comment,
        hasAttachments: validatedData.hasAttachments,
      },
    });

    // Handle file uploads if any
    if (validatedData.hasAttachments && validatedData.attachments?.length) {
      const uploadPromises = validatedData.attachments.map(async (file: File) => {
        const result = await uploadTechnicianTrainingFile(file, training.id, session.user.companyId);
        return prisma.technicianTrainingAttachment.create({
          data: {
            companyId: session.user.companyId,
            fileName: file.name,
            fileKey: result,
            fileSize: file.size,
            fileType: file.type,
            technicianTrainingId: training.id,
          },
        });
      });

      await Promise.all(uploadPromises);
    }

    return NextResponse.json(training);
  } catch (error) {
    console.error("Error creating training record:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const technician = searchParams.get("technician");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where = {
      companyId: session.user.companyId,
      ...(technician && { technician })
    };

    const [trainings, total] = await Promise.all([
      prisma.technicianTraining.findMany({
        where,
        include: {
          Attachment: true,
        },
        orderBy: {
          date: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.technicianTraining.count({ where }),
    ]);

    return NextResponse.json({
      trainings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching training records:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 