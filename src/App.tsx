/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, type FormEvent, type MouseEvent } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Tag as TagIcon, 
  Clock, 
  X, 
  Hash,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
type Note = {
  id: number;
  title: string;
  body: string;
  tags: string[];
  updatedAt: string;
};

type NoteFormData = {
  title: string;
  body: string;
  tags: string;
};

const STORAGE_KEY = "mymemo.notes";

// --- Seed Data ---
const SEED_NOTES: Note[] = [
  {
    id: 1,
    title: "시안 작업 가이드",
    body: "디자인 프로젝트의 완성도를 높이기 위한 색상 및 타이포그래피 규칙입니다.",
    tags: ["디자인", "가이드"],
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    title: "읽어야 할 책 리스트",
    body: "1. 클린 코드\n2. 리팩터링\n3. 디자인 패턴의 활용",
    tags: ["독서", "자기개발"],
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    title: "프로젝트 아이디어",
    body: "AI 기반 메모 요약 도구, 개인 가계부, 러닝 트래커 앱 기획 중.",
    tags: ["업무", "개발"],
    updatedAt: new Date().toISOString()
  }
];

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<NoteFormData>({
    title: "",
    body: "",
    tags: ""
  });

  // Load notes initially
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setNotes(JSON.parse(saved));
    } else {
      setNotes(SEED_NOTES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_NOTES));
    }
  }, []);

  // Save notes on change
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }
  }, [notes]);

  // Derived Tags
  const allTags = useMemo(() => {
    const tagsMap = new Map<string, number>();
    notes.forEach(note => {
      note.tags.forEach(tag => {
        tagsMap.set(tag, (tagsMap.get(tag) || 0) + 1);
      });
    });
    return Array.from(tagsMap.entries()).sort((a, b) => b[1] - a[1]);
  }, [notes]);

  // Filtering Logic
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesSearch = 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesTag = selectedTag === "All" || note.tags.includes(selectedTag);
      
      return matchesSearch && matchesTag;
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [notes, searchQuery, selectedTag]);

  // Handlers
  const handleOpenModal = (note?: Note) => {
    if (note) {
      setEditingNoteId(note.id);
      setFormData({
        title: note.title,
        body: note.body,
        tags: note.tags.join(", ")
      });
    } else {
      setEditingNoteId(null);
      setFormData({ title: "", body: "", tags: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNoteId(null);
  };

  const handleDeleteNote = (id: number, e: MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("정말 이 메모를 삭제하시겠습니까?")) {
      setNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  const handleSaveNote = (e: FormEvent) => {
    e.preventDefault();
    const tagArray = formData.tags
      .split(",")
      .map(t => t.trim())
      .filter(t => t !== "");

    if (editingNoteId !== null) {
      setNotes(prev => prev.map(n => n.id === editingNoteId ? {
        ...n,
        title: formData.title,
        body: formData.body,
        tags: tagArray,
        updatedAt: new Date().toISOString()
      } : n));
    } else {
      const newNote: Note = {
        id: Date.now(),
        title: formData.title || "제목 없음",
        body: formData.body,
        tags: tagArray,
        updatedAt: new Date().toISOString()
      };
      setNotes(prev => [newNote, ...prev]);
    }
    handleCloseModal();
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#212529] font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-[#E9ECEF] px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <ClipboardList size={22} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#212529]">MyMemo</h1>
        </div>
        
        <div className="flex items-center gap-4 flex-1 max-w-2xl px-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ADB5BD]" size={18} />
            <input 
              type="text" 
              placeholder="메모 내용, 태그 검색..."
              className="w-full bg-[#F1F3F5] border-none rounded-full py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full transition-all font-medium text-sm shadow-md shadow-blue-500/20 active:scale-95"
          id="btn-new-memo"
        >
          <Plus size={18} />
          <span>새 메모</span>
        </button>
      </header>

      <div className="max-w-[1400px] mx-auto flex gap-8 p-6">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 flex flex-col gap-6 sticky top-24 self-start">
          <div>
            <h2 className="text-xs font-bold text-[#868E96] uppercase tracking-wider mb-4 px-2">태그 필터</h2>
            <nav className="space-y-1">
              <button 
                onClick={() => setSelectedTag("All")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedTag === "All" ? "bg-blue-50 text-blue-700 font-semibold" : "text-[#495057] hover:bg-[#F1F3F5]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <ClipboardList size={16} />
                  <span>전체 메모</span>
                </div>
                <span className="text-xs opacity-60">{notes.length}</span>
              </button>
              
              {allTags.map(([tag, count]) => (
                <button 
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedTag === tag ? "bg-blue-50 text-blue-700 font-semibold" : "text-[#495057] hover:bg-[#F1F3F5]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Hash size={16} />
                    <span>{tag}</span>
                  </div>
                  <span className="text-xs opacity-60">{count}</span>
                </button>
              ))}
            </nav>
          </div>
          
          <div className="mt-auto p-4 bg-white border border-[#E9ECEF] rounded-2xl shadow-sm">
            <p className="text-[11px] text-[#ADB5BD] leading-relaxed">
              모든 데이터는 브라우저의 <br /> 로컬 스토리지에 저장됩니다.
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[#343A40]">
              {selectedTag === "All" ? "모든 메모" : `#${selectedTag}`}
              <span className="ml-2 text-sm font-normal text-[#ADB5BD]">{filteredNotes.length}개</span>
            </h2>
          </div>

          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-[#ADB5BD]">
              <div className="bg-[#F1F3F5] p-6 rounded-full mb-4">
                <Search size={48} strokeWidth={1} />
              </div>
              <p className="text-sm">검색 결과가 없거나 메모가 비어있습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
              <AnimatePresence mode="popLayout">
                {filteredNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => handleOpenModal(note)}
                    className="group relative bg-white border border-[#E9ECEF] rounded-2xl p-5 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                    id={`note-${note.id}`}
                  >
                    <button 
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="absolute top-4 right-4 p-2 text-[#DEE2E6] hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                      title="삭제하기"
                    >
                      <Trash2 size={18} />
                    </button>

                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2 text-[#212529] line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {note.title}
                      </h3>
                      <p className="text-[#495057] text-sm leading-relaxed line-clamp-4 mb-4 whitespace-pre-wrap">
                        {note.body}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#F8F9FA] flex flex-wrap gap-1.5 min-h-[28px]">
                      {note.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="px-2 py-0.5 bg-[#F1F3F5] text-[#868E96] rounded-md text-[11px] font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[#ADB5BD] text-[11px]">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>

      {/* Modal / Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-[#E9ECEF] flex items-center justify-between bg-[#F8F9FA]/50">
                <h2 className="font-bold text-xl text-[#212529]">
                  {editingNoteId ? "메모 수정" : "새 메모 작성"}
                </h2>
                <button 
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-[#E9ECEF] rounded-full text-[#868E96] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveNote} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                  <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                    <label className="text-xs font-bold uppercase tracking-widest text-inherit opacity-70">제목</label>
                    <input 
                      type="text" 
                      className="w-full text-lg font-bold border-none outline-none focus:ring-0 p-0 placeholder-[#DEE2E6]"
                      placeholder="메모 제목을 입력하세요"
                      autoFocus
                      required
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                    <label className="text-xs font-bold uppercase tracking-widest text-inherit opacity-70">내용</label>
                    <textarea 
                      className="w-full text-sm leading-relaxed border-none outline-none focus:ring-0 p-0 placeholder-[#DEE2E6] min-h-[200px] resize-none"
                      placeholder="자유롭게 적어보세요..."
                      required
                      value={formData.body}
                      onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-widest text-[#868E96]">태그</label>
                      <span className="text-[10px] text-[#ADB5BD]">쉼표(,)로 구분</span>
                    </div>
                    <div className="relative">
                      <TagIcon className="absolute left-0 top-1/2 -translate-y-1/2 text-[#ADB5BD]" size={16} />
                      <input 
                        type="text" 
                        className="w-full text-sm border-none outline-none focus:ring-0 pl-7 p-0 placeholder-[#DEE2E6]"
                        placeholder="예: 업무, 아이디어, 할일"
                        value={formData.tags}
                        onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-[#F8F9FA]/50 border-t border-[#E9ECEF] flex items-center justify-end gap-3">
                  <button 
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-2.5 rounded-full text-sm font-semibold text-[#495057] hover:bg-[#E9ECEF] transition-all"
                  >
                    취소
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-2.5 rounded-full text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                  >
                    저장하기
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E9ECEF;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #DEE2E6;
        }
      `}</style>
    </div>
  );
}
