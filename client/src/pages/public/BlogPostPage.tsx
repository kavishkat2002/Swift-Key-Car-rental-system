import React, { useState, useEffect } from 'react';
import { BlogPost } from '../../types';
import { api } from '../../services/api';
import { Calendar, Clock, ArrowLeft, Compass, Car } from 'lucide-react';

interface BlogPostPageProps {
  slug: string;
  onBack: () => void;
  onNavigateFleet: () => void;
}

export const BlogPostPage: React.FC<BlogPostPageProps> = ({ slug, onBack, onNavigateFleet }) => {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.blog.getBySlug(slug)
      .then((res) => {
        if (!isMounted) return;
        setPost(res.post);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500">
        Loading driving guide...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600 mb-4">Article guide not found.</p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-[#102A43] text-white text-xs font-semibold rounded-md"
        >
          Return to Guides
        </button>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <button
        type="button"
        onClick={onBack}
        className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1.5"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Driving Guides</span>
      </button>

      {/* Header */}
      <div className="space-y-4">
        <div className="inline-block bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold px-2.5 py-1 rounded">
          {post.category}
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#102A43] leading-tight">
          {post.title}
        </h1>

        <div className="flex items-center gap-6 text-xs text-[#526477] border-y border-slate-200 py-3">
          <div className="font-semibold text-slate-800">By {post.author_name}</div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(post.published_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{post.read_time_minutes} min read</span>
          </div>
        </div>
      </div>

      {/* Feature Cover Image */}
      <div className="rounded-xl overflow-hidden aspect-16/9 bg-slate-100 border border-slate-200">
        <img
          src={post.cover_image}
          alt={post.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Article Body */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-sans">
        {post.content || post.excerpt}
      </div>

      {/* Call to Action Box */}
      <div className="bg-[#102A43] text-white p-6 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-base">Planning this Sri Lankan route?</h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Rent an SUV or economical hybrid with verified GPS navigation and 24/7 breakdown assist.
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateFleet}
          className="px-5 py-2.5 bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-semibold rounded-lg shrink-0 flex items-center gap-2"
        >
          <Car className="w-4 h-4" />
          <span>Browse Recommended Fleet</span>
        </button>
      </div>
    </article>
  );
};
