import { askAssistant } from "./askassistant";
import { api } from "./_generated/api";

describe("askAssistant", () => {
  // Mock context and queries
  const mockCtx = {
    runQuery: jest.fn(),
  };
  const userId = "test-user-id";
  const workspaceId = "test-workspace-id";
  const channelId = "test-channel-id";

  it("denies access for non-members", async () => {
    mockCtx.runQuery.mockResolvedValueOnce(false);
    await expect(
      askAssistant.handler(mockCtx as any, {
        query: "list users in this workspace",
        userId,
        workspaceId,
      })
    ).rejects.toThrow("Access denied");
  });

  it("lists users for members", async () => {
    mockCtx.runQuery.mockResolvedValueOnce(true); // isMember
    mockCtx.runQuery.mockResolvedValueOnce([
      { name: "Alice", email: "alice@example.com", _id: "1" },
      { name: "Bob", email: "bob@example.com", _id: "2" },
    ]);
    const result = await askAssistant.handler(mockCtx as any, {
      query: "list users in this workspace",
      userId,
      workspaceId,
    });
    expect(result.answer).toContain("Alice");
    expect(result.answer).toContain("Bob");
  });

  // Add more tests for each intent and forbidden action
});
