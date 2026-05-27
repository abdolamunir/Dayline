import React, { useMemo, useState } from 'react';
import { Search01Icon as Search, ShuffleIcon as Shuffle, Cancel01Icon as X, Home01Icon as Home, Notification01Icon as Bell, Settings01Icon as Settings, Add01Icon as Plus, Message02Icon as MessageSquare, Calendar01Icon as Calendar, InboxIcon as Inbox, PencilEdit01Icon as Pencil, CheckmarkCircle02Icon as CheckCircle2, Target01Icon as Target, Layers01Icon as Layers, Activity01Icon as Activity, SmileIcon as Smile, StethoscopeIcon as Stethoscope, Book01Icon as Book, FeatherIcon as Feather, Folder01Icon as Folder, Dumbbell01Icon as Dumbbell, Restaurant01Icon as Utensils, ShoppingCart01Icon as ShoppingCart, Bookmark01Icon as Bookmark, Airplane01Icon as Plane, LibraryIcon as Library, ShoppingBag01Icon as ShoppingBag, PlayCircle02Icon as MonitorPlay, UserGroupIcon as Users, File01Icon as File, DashboardSquare01Icon as LayoutDashboard, DeliveryBox01Icon as Box, DatabaseIcon as Database, Plug01Icon as Plug, Clock01Icon as Clock, File02Icon as FileText, LockIcon as Lock, Shield01Icon as Shield, Wallet01Icon as Wallet, Download01Icon as Download, Upload01Icon as Upload, StarIcon as Star, FavouriteIcon as Heart, ZapIcon as Zap, FireIcon as Flame, CloudIcon as Cloud, Sun01Icon as Sun, MoonIcon as Moon, Coffee01Icon as Coffee, Pizza01Icon as Pizza, MusicNote01Icon as Music, Camera01Icon as Camera, Video01Icon as Video, MapsIcon as Map, GlobeIcon as Globe, Navigation01Icon as Navigation, AnchorIcon as Anchor, Briefcase01Icon as Briefcase, CapIcon as GraduationCap, Award01Icon as Trophy, Medal01Icon as Medal, SmartPhone01Icon as Smartphone, LaptopIcon as Laptop, Tablet01Icon as Tablet, CpuIcon as Cpu, HardDriveIcon as HardDrive, Mouse01Icon as Mouse, KeyboardIcon as Keyboard, Mail01Icon as Mail, CallIcon as Phone, Share01Icon as Share2, Link01Icon as Link, HashtagIcon as Hash, AtIcon as AtSign, AlertCircleIcon as AlertCircle, HelpCircleIcon as HelpCircle, InformationCircleIcon as Info, Tick01Icon as Check, Alert01Icon as AlertTriangle, ArrowUp01Icon as ArrowUp, ArrowDown01Icon as ArrowDown, ArrowLeft01Icon as ArrowLeft, ArrowRight01Icon as ArrowRight, Maximize01Icon as Maximize, Minimize01Icon as Minimize, RefreshIcon as RefreshCw, ReloadIcon as RotateCw, EyeIcon as Eye, ViewOffIcon as EyeOff, LockIcon as LockKeyhole, Key01Icon as Key, UserIcon as User, UserAdd01Icon as UserPlus, UserMinus01Icon as UserMinus, UserCheck01Icon as UserCheck, Image01Icon as Image, Film01Icon as Film, PlayIcon as Play, PauseIcon as Pause, SquareIcon as Square, Mic01Icon as Mic, HeadphonesIcon as Headphones, SpeakerIcon as Speaker, Delete02Icon as Trash2, Archive01Icon as Archive, FilterIcon as Filter, ListViewIcon as List, GridIcon as Grid, BarChartIcon as BarChart, PieChartIcon as PieChart, ChartLineData01Icon as LineChart, ArrowUpRight01Icon as TrendingUp, GameboyIcon as Ghost, GameController01Icon as Gamepad2, AmbulanceIcon as Ambulance, AppleIcon as Apple, WaveIcon as Waves, WavingHand01Icon as Hand, InstagramIcon as Instagram, Facebook01Icon as Facebook, TwitterIcon as Twitter, Linkedin01Icon as Linkedin, GithubIcon as Github, SlackIcon as Slack, DiscordIcon as Discord, YoutubeIcon as Youtube, SpotifyIcon as Spotify, PinterestIcon as Pinterest, TwitchIcon as Twitch, TiktokIcon as Tiktok, SnapchatIcon as Snapchat, WhatsappIcon as Whatsapp, TelegramIcon as Telegram, RedditIcon as Reddit, MediumIcon as Medium, Behance01Icon as Behance, DribbbleIcon as Dribbble, FigmaIcon as Figma, GoogleIcon as Google, MicrosoftIcon as Microsoft, AmazonIcon as Amazon, AirbnbIcon as Airbnb, UberIcon as Uber, Brain01Icon as Brain, RocketIcon as Rocket, CodeIcon as Code, Bug01Icon as Bug, DnaIcon as Dna, MicroscopeIcon as Microscope, Telescope01Icon as Telescope, Compass01Icon as Compass, Flag01Icon as Flag, StopWatchIcon as Stopwatch, VideoOffIcon as VideoOff, VolumeUpIcon as VolumeHigh, VolumeMinusIcon as VolumeLow, VolumeMute01Icon as VolumeMute, BluetoothIcon as Bluetooth, Wifi01Icon as Wifi, BatteryFullIcon as Battery, BatteryCharging01Icon as BatteryCharging, FlashlightIcon as Flashlight, Scissor01Icon as Scissors, PaintBrush01Icon as Paintbrush, PenTool01Icon as PenTool, EraserIcon as Eraser, RulerIcon as Ruler, MagnetIcon as Magnet, Attachment01Icon as Attachment, Tag01Icon as Tag, Ticket01Icon as Ticket, CrownIcon as Crown, DiamondIcon as Diamond, GemIcon as Gem, IceCream01Icon as IceCream, EggsIcon as Egg, Motorbike01Icon as Motorbike, Hotel01Icon as Hotel, MountainIcon as Mountain, BeachIcon as Beach, Tree01Icon as Tree, Leaf01Icon as Leaf, FlowerIcon as Flower, CactusIcon as Cactus } from 'hugeicons-react';

import { cn } from '../utils/cn';

const RECENT_ICONS_STORAGE_KEY = 'dayline:recent-icons';
const MAX_RECENT_ICONS = 12;

export const ALL_ICONS: Record<string, React.ElementType> = {
  Home, Bell, Settings, Plus, MessageSquare, Calendar, Inbox,
  Pencil, CheckCircle2, Target, Layers, Activity, Smile, Stethoscope, Book, Feather,
  Folder, Dumbbell, Utensils, ShoppingCart, Bookmark, Plane, Library, ShoppingBag, MonitorPlay, Users, File,
  LayoutDashboard, Box, Database, Plug, Clock, FileText, Lock, Shield, Wallet, Download, Upload,
  Star, Heart, Zap, Flame, Cloud, Sun, Moon, Coffee, Pizza, Music, Camera, Video,
  Map, Globe, Navigation, Anchor, Briefcase, GraduationCap, Trophy, Medal,
  Smartphone, Laptop, Tablet, Cpu, HardDrive, Mouse, Keyboard,
  Mail, Phone, Share2, Link, Hash, AtSign,
  AlertCircle, HelpCircle, Info, Check, AlertTriangle,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Maximize, Minimize, RefreshCw, RotateCw,
  Eye, EyeOff, LockKeyhole, Key,
  User, UserPlus, UserMinus, UserCheck,
  Image, Film, Play, Pause, Square,
  Mic, Headphones, Speaker,
  Trash2, Archive, Filter, List, Grid,
  BarChart, PieChart, LineChart, TrendingUp,
  Ghost, Gamepad2, Ambulance, Apple, Waves, Hand,
  Instagram, Facebook, Twitter, Linkedin, Github, Slack, Discord, Youtube, Spotify, Pinterest, Twitch, Tiktok, Snapchat, Whatsapp, Telegram, Reddit, Medium, Behance, Dribbble, Figma, Google, Microsoft, Amazon, Airbnb, Uber,
  Brain, Rocket, Code, Bug, Dna, Microscope, Telescope, Compass, Flag, Stopwatch, VideoOff, VolumeHigh, VolumeLow, VolumeMute, Bluetooth, Wifi, Battery, BatteryCharging, Flashlight, Scissors, Paintbrush, PenTool, Eraser, Ruler, Magnet, Attachment, Tag, Ticket, Crown, Diamond, Gem,
  IceCream, Egg,
  Motorbike, Hotel, Mountain, Beach, Tree,
  Leaf, Flower, Cactus
};

interface IconPickerProps {
  currentIcon: string;
  onSelect: (iconName: string) => void;
  onClose: () => void;
  onRemove?: () => void;
}

export function IconPicker({ currentIcon, onSelect, onClose, onRemove }: IconPickerProps) {
  const [search, setSearch] = useState('');
  const [recentIcons, setRecentIcons] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];

    try {
      const savedIcons = JSON.parse(window.localStorage.getItem(RECENT_ICONS_STORAGE_KEY) || '[]');
      return Array.isArray(savedIcons)
        ? savedIcons.filter((name): name is string => typeof name === 'string' && !!ALL_ICONS[name]).slice(0, MAX_RECENT_ICONS)
        : [];
    } catch {
      return [];
    }
  });

  const filteredIcons = Object.entries(ALL_ICONS).filter(([name]) => 
    name.toLowerCase().includes(search.toLowerCase())
  );
  const visibleRecentIcons = useMemo(
    () => [currentIcon, ...recentIcons.filter(name => name !== currentIcon)]
      .filter(name => !!ALL_ICONS[name])
      .slice(0, MAX_RECENT_ICONS)
      .map(name => [name, ALL_ICONS[name]] as const),
    [currentIcon, recentIcons]
  );

  const saveRecentIcon = (iconName: string) => {
    const nextRecentIcons = [iconName, ...recentIcons.filter(name => name !== iconName)].slice(0, MAX_RECENT_ICONS);
    setRecentIcons(nextRecentIcons);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(RECENT_ICONS_STORAGE_KEY, JSON.stringify(nextRecentIcons));
    }
  };

  const handleSelect = (iconName: string) => {
    saveRecentIcon(iconName);
    onSelect(iconName);
  };

  const handleRandomize = () => {
    const names = Object.keys(ALL_ICONS);
    const randomName = names[Math.floor(Math.random() * names.length)];
    handleSelect(randomName);
  };

  return (
    <div className="flex flex-col w-64 bg-[var(--tokyo-panel)] border border-[var(--tokyo-border-strong)] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--tokyo-border)]">
        <div className="text-xs font-medium text-[var(--tokyo-text-muted)]">
          Icons
        </div>
        {onRemove && (
          <button 
            onClick={onRemove}
            className="text-xs font-medium text-[var(--tokyo-text-faint)] hover:text-[var(--tokyo-pink)] transition-colors cursor-pointer"
          >
            Remove
          </button>
        )}
      </div>

      {/* Search & Actions */}
      <div className="p-2 flex gap-1.5">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--tokyo-text-faint)]" />
          <input 
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-md border border-[var(--tokyo-border-strong)] bg-transparent py-1 pl-8 pr-2 !text-[13px] leading-none text-[var(--tokyo-text-strong)] placeholder:!text-[13px] placeholder:text-[var(--tokyo-text-faint)] focus:border-[var(--tokyo-border-strong)] focus:outline-none focus:ring-0"
            autoFocus
          />
        </div>
        <button 
          onClick={handleRandomize}
          className="h-8 w-8 rounded-md border border-[var(--tokyo-border-strong)] bg-transparent text-[var(--tokyo-text-faint)] hover:text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] transition-colors cursor-pointer flex items-center justify-center"
          title="Randomize"
        >
          <Shuffle className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto max-h-[280px] p-2 scrollbar-hide">
        {!search && visibleRecentIcons.length > 0 && (
          <div className="mb-2 border-b border-[var(--tokyo-border)] pb-2">
            <div className="px-1 pb-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--tokyo-text-faint)]">
              Recent
            </div>
            <div className="grid grid-cols-6 gap-0.5">
              {visibleRecentIcons.map(([name, Icon]) => (
                <button
                  key={name}
                  onClick={() => handleSelect(name)}
                  className="p-1.5 rounded-md flex items-center justify-center text-[var(--tokyo-text-faint)] transition-all hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text)] cursor-pointer"
                  title={name}
                >
                  <Icon className="w-4 h-4 stroke-[1.5]" />
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="grid grid-cols-6 gap-0.5">
          {filteredIcons.map(([name, Icon]) => (
            <button
              key={name}
              onClick={() => handleSelect(name)}
              className={cn(
                "p-1.5 rounded-md flex items-center justify-center transition-all cursor-pointer",
                currentIcon === name ? "bg-[var(--tokyo-yellow-dim)] text-[var(--tokyo-text-strong)]" : "text-[var(--tokyo-text-faint)] hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text)]"
              )}
              title={name}
            >
              <Icon className="w-4 h-4 stroke-[1.5]" />
            </button>
          ))}
        </div>
        {filteredIcons.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-white/10">
            <Search className="w-8 h-8 mb-1 opacity-5" />
            <p className="text-xs">No icons found</p>
          </div>
        )}
      </div>
    </div>
  );
}
