import React, { useState, useEffect } from 'react';
import { BlogPost } from '../../types';
import { api } from '../../services/api';
import { Calendar, Clock, ArrowRight, Compass } from 'lucide-react';

interface BlogListProps {
  onSelectPost: (slug: string) => void;
}

export const BlogList: React.FC<BlogListProps> = ({ onSelectPost }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.blog.getAll()
      .then((res) => {
        if (!isMounted) return;
        setPosts(res.posts);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="border-b border-slate-200 pb-5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-2">
          <Compass className="w-3.5 h-3.5 text-teal-700" />
          <span>Sri Lanka Self-Drive Travel Desk</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#102A43] tracking-tight">
          Sri Lanka Road Trips & Driving Advice
        </h1>
        <p className="text-xs sm:text-sm text-[#526477] mt-1">
          Practical navigation insights, highway toll guidance, and recommended vehicle classes for touring the island from Negombo.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2].map((n) => (
            <div key={n} className="bg-white rounded-xl border border-slate-200 h-80 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-16/9 bg-slate-100 overflow-hidden">
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-[#102A43] text-white text-[11px] font-semibold px-2.5 py-1 rounded">
                    {post.category}
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-4 text-[11px] text-[#526477]">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(post.published_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{post.read_time_minutes} min read</span>
                    </div>
                  </div>

                  <h2 className="text-lg font-bold text-[#102A43] leading-snug">
                    {post.title}
                  </h2>

                  <p className="text-xs text-[#526477] leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">By {post.author_name}</span>
                <button
                  type="button"
                  onClick={() => onSelectPost(post.slug)}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                >
                  <span>Read Guide</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
