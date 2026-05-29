using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ChatApp.Models.Entity;

public class Chat
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public List<string> ParticipantIds { get; set; } = new();

    public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;
}
