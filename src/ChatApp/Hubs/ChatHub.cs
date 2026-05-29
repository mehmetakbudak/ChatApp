using ChatApp.Data;
using ChatApp.Models.Dtos;
using ChatApp.Models.Entity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MongoDB.Driver;
using System.Security.Claims;

namespace ChatApp.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly AppDbContext _context;

    public ChatHub(AppDbContext context)
    {
        _context = context;
    }

    public async Task SendMessage(string receiverId, string chatId, string content)
    {
        //token içerisinden mesajı gönderen kullanıcının id'sini alıyoruz 
        var senderId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(senderId))
            return;

        var newMessage = new Message
        {
            ChatId = chatId,
            SenderId = senderId,
            Content = content,
            CreatedDate = DateTime.UtcNow
        };
        await _context.Messages.AddAsync(newMessage);

        var chat = await _context.Chats.FirstOrDefaultAsync(c => c.Id == chatId);

        if (chat != null)
        {
            chat.LastMessageAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        var message = new GetChatMessages(
            newMessage.Id,
            newMessage.ChatId,
            newMessage.SenderId,
            newMessage.Content,
            newMessage.CreatedDate,
            newMessage.UpdatedDate,
            newMessage.IsRead);

        // mesajı alıcıya ve gönderene anlık iletiyoruz
        await Clients.User(senderId).SendAsync("ReceiveMessage", message);
        await Clients.User(receiverId).SendAsync("ReceiveMessage", message);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            Console.WriteLine($"Kullanıcı koptu: {userId}");
        }
        await base.OnDisconnectedAsync(exception);
    }
}
