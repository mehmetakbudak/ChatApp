using ChatApp.Data;
using ChatApp.Models.Dtos;
using ChatApp.Models.Entity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ChatApp.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]/[action]")]
public class ChatController(AppDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetMyChats(CancellationToken cancellationToken)
    {
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(currentUserId))
            return Unauthorized();

        var chats = await context.Chats
            .Where(c => c.ParticipantIds.Contains(currentUserId))
            .OrderByDescending(c => c.LastMessageAt)
            .ToListAsync(cancellationToken);

        var userIds = chats.SelectMany(c => c.ParticipantIds)
            .Where(id => id != currentUserId).Distinct().ToList();

        var users = await context.Users
            .Where(u => userIds.Contains(u.Id))
            .ToListAsync(cancellationToken);

        var list = new List<GetMyChatDto>();

        foreach (var chat in chats)
        {
            var user = users.FirstOrDefault(u => u.Id == chat.ParticipantIds.FirstOrDefault(id => id != currentUserId));

            if (user == null)
                continue;

            var userDto = new UserDto(user.Id, user.FullName, user.Email);

            list.Add(new GetMyChatDto(chat.Id, userDto, chat.LastMessageAt));
        }
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetChatById(string id, CancellationToken cancellationToken)
    {
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(currentUserId))
            return Unauthorized();

        var chat = await context.Chats
            .FirstOrDefaultAsync(c => c.Id == id && c.ParticipantIds.Contains(currentUserId), cancellationToken);

        if (chat == null)
            return NotFound();

        var participants = await context.Users
                    .Where(u => chat.ParticipantIds.Contains(u.Id))
                    .Select(u => new UserDto(u.Id, u.FullName, u.Email))
                    .ToListAsync(cancellationToken);

        var messages = await context.Messages
            .Where(c => c.ChatId == id).Select(u => new GetChatMessages(
                u.Id,
                u.ChatId,
                u.SenderId,
                u.Content,
                u.CreatedDate,
                u.UpdatedDate,
                u.IsRead))
            .ToListAsync(cancellationToken);

        var result = new GetChatDetails(chat.Id, chat.LastMessageAt, participants, messages);

        return Ok(result);
    }

    [HttpPost("{receiverId}")]
    public async Task<IActionResult> CreateChat(string receiverId, CancellationToken cancellationToken)
    {
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(currentUserId))
            return Unauthorized();

        var existingChat = await context.Chats
            .FirstOrDefaultAsync(c => c.ParticipantIds.Contains(currentUserId) && c.ParticipantIds.Contains(receiverId), cancellationToken);

        if (existingChat != null)
            return Ok(existingChat);

        var newChat = new Chat
        {
            ParticipantIds = new List<string> { currentUserId, receiverId },
            LastMessageAt = DateTime.UtcNow
        };

        await context.Chats.AddAsync(newChat, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        return Ok(newChat);
    }

}
