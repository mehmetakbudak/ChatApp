using ChatApp.Models.Entity;

namespace ChatApp.Models.Dtos
{
    public record GetMyChatDto(
        string? Id,
        UserDto User,
        DateTime LastMessageAt);

    public record GetChatMessages(
        string? Id,
        string ChatId,
        string SenderUserId,
        string Content,
        DateTime CreatedDate,
        DateTime? UpdatedDate,
        bool IsRead);

    public record GetChatDetails(
        string? Id,
        DateTime LastMessageAt,
        List<UserDto> Participants,
        List<GetChatMessages> Messages);
}
