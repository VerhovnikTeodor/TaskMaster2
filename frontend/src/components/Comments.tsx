import React, { useState, useEffect } from 'react';
import { commentService, Comment } from '../services/commentService';
import { useAuth } from '../context/AuthContext';
import '../styles/Comments.css';

interface CommentsProps {
  taskId: string;
  projectOwnerId: string;
}

const Comments: React.FC<CommentsProps> = ({ taskId, projectOwnerId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  const fetchComments = async () => {
    try {
      const data = await commentService.getTaskComments(taskId);
      setComments(data);
    } catch (err) {
      console.error('Napaka pri nalaganju komentarjev');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const comment = await commentService.createComment({
        taskId,
        content: newComment
      });
      setComments([comment, ...comments]);
      setNewComment('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Napaka pri dodajanju komentarja');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleUpdate = async (id: string) => {
    if (!editContent.trim() || submitting) return;

    setSubmitting(true);
    try {
      const updated = await commentService.updateComment(id, {
        content: editContent
      });
      setComments(comments.map(c => c.id === id ? updated : c));
      setEditingId(null);
      setEditContent('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Napaka pri posodabljanju komentarja');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Ali ste prepričani, da želite izbrisati ta komentar?')) return;

    try {
      await commentService.deleteComment(id);
      setComments(comments.filter(c => c.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Napaka pri brisanju komentarja');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Pravkar';
    if (diffMins < 60) return `Pred ${diffMins} min`;
    if (diffHours < 24) return `Pred ${diffHours}h`;
    if (diffDays < 7) return `Pred ${diffDays}d`;
    
    return date.toLocaleDateString('sl-SI', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (loading) {
    return <div className="comments-loading">Nalaganje komentarjev...</div>;
  }

  return (
    <div className="comments-section">
      <h3>💬 Komentarji ({comments.length})</h3>
      
      <form onSubmit={handleSubmit} className="comment-form">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Dodaj komentar..."
          rows={3}
          disabled={submitting}
        />
        <button 
          type="submit" 
          className="btn btn-primary btn-sm"
          disabled={!newComment.trim() || submitting}
        >
          {submitting ? 'Dodajam...' : 'Objavi komentar'}
        </button>
      </form>

      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="no-comments">Še ni komentarjev. Bodi prvi!</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <div className="comment-author">
                  <span className="author-avatar">
                    {comment.author?.firstName[0]}{comment.author?.lastName[0]}
                  </span>
                  <div>
                    <strong>{comment.author?.firstName} {comment.author?.lastName}</strong>
                    <span className="comment-time">{formatDate(comment.createdAt)}</span>
                    {comment.updatedAt !== comment.createdAt && (
                      <span className="comment-edited"> (urejeno)</span>
                    )}
                  </div>
                </div>
                {comment.authorId === user?.id && (
                  <div className="comment-actions">
                    {editingId !== comment.id && (
                      <>
                        <button 
                          onClick={() => handleEdit(comment)}
                          className="btn-icon"
                          title="Uredi"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDelete(comment.id)}
                          className="btn-icon"
                          title="Izbriši"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                )}
                {comment.authorId !== user?.id && projectOwnerId === user?.id && (
                  <button 
                    onClick={() => handleDelete(comment.id)}
                    className="btn-icon"
                    title="Izbriši (lastnik projekta)"
                  >
                    🗑️
                  </button>
                )}
              </div>
              
              {editingId === comment.id ? (
                <div className="comment-edit">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    disabled={submitting}
                  />
                  <div className="edit-actions">
                    <button 
                      onClick={() => {
                        setEditingId(null);
                        setEditContent('');
                      }}
                      className="btn btn-secondary btn-xs"
                      disabled={submitting}
                    >
                      Prekliči
                    </button>
                    <button 
                      onClick={() => handleUpdate(comment.id)}
                      className="btn btn-primary btn-xs"
                      disabled={!editContent.trim() || submitting}
                    >
                      {submitting ? 'Shranjujem...' : 'Shrani'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="comment-content">{comment.content}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;
