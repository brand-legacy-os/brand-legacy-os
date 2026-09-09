-- TaskAttachment: distinguir link de referência de arquivo de entrega
ALTER TABLE "TaskAttachment" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'referencia';

-- TaskSubtask
CREATE TABLE "TaskSubtask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'media',
    "status" TEXT NOT NULL DEFAULT 'no_ritmo',
    "deadline" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskSubtask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskSubtask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "TaskSubtask_taskId_idx" ON "TaskSubtask"("taskId");

-- TaskSubtaskAttachment
CREATE TABLE "TaskSubtaskAttachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subtaskId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'referencia',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskSubtaskAttachment_subtaskId_fkey" FOREIGN KEY ("subtaskId") REFERENCES "TaskSubtask" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "TaskSubtaskAttachment_subtaskId_idx" ON "TaskSubtaskAttachment"("subtaskId");
