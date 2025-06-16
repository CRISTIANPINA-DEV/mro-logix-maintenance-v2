class DatabaseMetrics {
  private static instance: DatabaseMetrics;
  private metrics: Map<string, {
    reads: number;
    writes: number;
    bytesRead: number;
    bytesWritten: number;
    lastReset: Date;
  }>;

  private constructor() {
    this.metrics = new Map();
  }

  public static getInstance(): DatabaseMetrics {
    if (!DatabaseMetrics.instance) {
      DatabaseMetrics.instance = new DatabaseMetrics();
    }
    return DatabaseMetrics.instance;
  }

  public trackOperation(companyId: string, operation: 'read' | 'write', dataSize: number = 0) {
    const companyMetrics = this.metrics.get(companyId) || {
      reads: 0,
      writes: 0,
      bytesRead: 0,
      bytesWritten: 0,
      lastReset: new Date()
    };

    if (operation === 'read') {
      companyMetrics.reads++;
      companyMetrics.bytesRead += dataSize;
    } else {
      companyMetrics.writes++;
      companyMetrics.bytesWritten += dataSize;
    }

    this.metrics.set(companyId, companyMetrics);
  }

  public getMetrics(companyId: string) {
    return this.metrics.get(companyId) || {
      reads: 0,
      writes: 0,
      bytesRead: 0,
      bytesWritten: 0,
      lastReset: new Date()
    };
  }

  public resetMetrics(companyId: string) {
    this.metrics.set(companyId, {
      reads: 0,
      writes: 0,
      bytesRead: 0,
      bytesWritten: 0,
      lastReset: new Date()
    });
  }
}

export const dbMetrics = DatabaseMetrics.getInstance(); 