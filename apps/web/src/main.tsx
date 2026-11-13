import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, StrictMode, Suspense, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, createHashRouter, Navigate, RouterProvider, useLocation } from 'react-router';
import { Shell } from './components/Shell';
import { OfflineBar, Spinner, ToastProvider } from './components/ui';
import { ApiError, errorText } from './lib/api';
import { AuthProvider, useAuth } from './lib/auth';
import Login from './pages/Login';
import { NotFound, RouteError, TermsPage, VerifyPage } from './pages/Public';
import Settings, { applyTheme, savedTheme } from './pages/Settings';
import './styles/app.css';

// همهٔ صفحه‌ها جدا بار می‌شوند تا صفحهٔ ورود روی اینترنت ضعیف سبک باشد (فقط ورود، صفحه‌های عمومی و تنظیمات در بستهٔ اول‌اند)
const AdminShell = lazy(() => import('./pages/admin/AdminShell'));
const CourseEditor = lazy(() => import('./pages/admin/CourseEditor'));
const Courses = lazy(() => import('./pages/admin/Courses'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Audit = lazy(() => import('./pages/admin/Manage').then((m) => ({ default: m.Audit })));
const Certificates = lazy(() => import('./pages/admin/Manage').then((m) => ({ default: m.Certificates })));
const Grants = lazy(() => import('./pages/admin/Manage').then((m) => ({ default: m.Grants })));
const Mosques = lazy(() => import('./pages/admin/Manage').then((m) => ({ default: m.Mosques })));
const Paths = lazy(() => import('./pages/admin/Manage').then((m) => ({ default: m.Paths })));
const UsersPage = lazy(() => import('./pages/admin/Manage').then((m) => ({ default: m.UsersPage })));
const Course = lazy(() => import('./pages/Course'));
const Home = lazy(() => import('./pages/Home'));
const Learn = lazy(() => import('./pages/Learn'));
const PathPage = lazy(() => import('./pages/Learn').then((m) => ({ default: m.PathPage })));
const Lesson = lazy(() => import('./pages/Lesson'));
const Review = lazy(() => import('./pages/Review'));
const CohortPage = lazy(() => import('./pages/Cohort'));
const Me = lazy(() => import('./pages/Me'));
const Events = lazy(() => import('./pages/Events'));
const EventPage = lazy(() => import('./pages/Events').then((m) => ({ default: m.EventPage })));
const CheckIn = lazy(() => import('./pages/ManageEvents').then((m) => ({ default: m.CheckIn })));
const EventEditor = lazy(() => import('./pages/ManageEvents').then((m) => ({ default: m.EventEditor })));
const ManageEvent = lazy(() => import('./pages/ManageEvents').then((m) => ({ default: m.ManageEvent })));
const ManageEventList = lazy(() => import('./pages/ManageEvents').then((m) => ({ default: m.ManageEventList })));
const RahyarAssign = lazy(() => import('./pages/Rahyar').then((m) => ({ default: m.RahyarAssign })));
const RahyarConversation = lazy(() => import('./pages/Rahyar').then((m) => ({ default: m.RahyarConversation })));
const RahyarHome = lazy(() => import('./pages/Rahyar').then((m) => ({ default: m.RahyarHome })));
const RahyarLearner = lazy(() => import('./pages/Rahyar').then((m) => ({ default: m.RahyarLearner })));
const RahyarLearners = lazy(() => import('./pages/Rahyar').then((m) => ({ default: m.RahyarLearners })));
const RahyarMessages = lazy(() => import('./pages/Rahyar').then((m) => ({ default: m.RahyarMessages })));
const RahyarReport = lazy(() => import('./pages/Rahyar').then((m) => ({ default: m.RahyarReport })));
const RahyarReports = lazy(() => import('./pages/Rahyar').then((m) => ({ default: m.RahyarReports })));
const CorePage = lazy(() => import('./pages/Social').then((m) => ({ default: m.CorePage })));
const ImamPage = lazy(() => import('./pages/Social').then((m) => ({ default: m.ImamPage })));
const JoinPage = lazy(() => import('./pages/Social').then((m) => ({ default: m.JoinPage })));
const Messages = lazy(() => import('./pages/Social').then((m) => ({ default: m.Messages })));
const MyCores = lazy(() => import('./pages/Social').then((m) => ({ default: m.MyCores })));
const Notifications = lazy(() => import('./pages/Social').then((m) => ({ default: m.Notifications })));
const OrgList = lazy(() => import('./pages/Social').then((m) => ({ default: m.OrgList })));
const OrgPage = lazy(() => import('./pages/Social').then((m) => ({ default: m.OrgPage })));
const RahyarTree = lazy(() => import('./pages/admin/RahyarTree'));
const AdminSupport = lazy(() => import('./pages/Support').then((m) => ({ default: m.AdminSupport })));
const Help = lazy(() => import('./pages/Support').then((m) => ({ default: m.Help })));
const TicketPage = lazy(() => import('./pages/Support').then((m) => ({ default: m.TicketPage })));
const AdminBroadcasts = lazy(() => import('./pages/Broadcast').then((m) => ({ default: m.AdminBroadcasts })));
const BroadcastPage = lazy(() => import('./pages/Broadcast').then((m) => ({ default: m.BroadcastPage })));
const AccessLogPage = lazy(() => import('./pages/admin/Extra').then((m) => ({ default: m.AccessLogPage })));
const Samples = lazy(() => import('./pages/admin/Extra').then((m) => ({ default: m.Samples })));
const ToolsAdmin = lazy(() => import('./pages/admin/Extra').then((m) => ({ default: m.ToolsAdmin })));
const AdminBusiness = lazy(() => import('./pages/Business').then((m) => ({ default: m.AdminBusiness })));
const FeedbackAdmin = lazy(() => import('./pages/admin/Feedback'));
const CampaignList = lazy(() => import('./pages/Campaigns'));
const CampaignEditor = lazy(() => import('./pages/Campaigns').then((m) => ({ default: m.CampaignEditor })));
const CampaignPage = lazy(() => import('./pages/Campaigns').then((m) => ({ default: m.CampaignPage })));
const ManageCampaign = lazy(() => import('./pages/Campaigns').then((m) => ({ default: m.ManageCampaign })));
const ManageCampaigns = lazy(() => import('./pages/Campaigns').then((m) => ({ default: m.ManageCampaigns })));
const Toolbox = lazy(() => import('./pages/Tools'));
const BoardPage = lazy(() => import('./pages/Tools').then((m) => ({ default: m.BoardPage })));
const PublicBoard = lazy(() => import('./pages/Tools').then((m) => ({ default: m.PublicBoard })));
const ToolPage = lazy(() => import('./pages/Tools').then((m) => ({ default: m.ToolPage })));
const PathExam = lazy(() => import('./pages/Learn').then((m) => ({ default: m.PathExam })));
const PeersPage = lazy(() => import('./pages/Peers'));
const GaadePage = lazy(() => import('./pages/Peers').then((m) => ({ default: m.GaadePage })));
const QuestionPage = lazy(() => import('./pages/Peers').then((m) => ({ default: m.QuestionPage })));
const Field = lazy(() => import('./pages/Field'));
const Onboard = lazy(() => import('./pages/Onboard'));
const PubHome = lazy(() => import('./pages/Pub').then((m) => ({ default: m.PubHome })));
const PubImpact = lazy(() => import('./pages/Pub').then((m) => ({ default: m.PubImpact })));
const PubLibrary = lazy(() => import('./pages/Pub').then((m) => ({ default: m.PubLibrary })));
const PubPathBuilder = lazy(() => import('./pages/Pub').then((m) => ({ default: m.PubPathBuilder })));
const PubRahyars = lazy(() => import('./pages/Pub').then((m) => ({ default: m.PubRahyars })));
const PubShell = lazy(() => import('./pages/Pub').then((m) => ({ default: m.PubShell })));
const Publishers = lazy(() => import('./pages/admin/Review').then((m) => ({ default: m.Publishers })));
const ReviewQueue = lazy(() => import('./pages/admin/Review').then((m) => ({ default: m.ReviewQueue })));
const StudioAnalytics = lazy(() => import('./pages/Studio').then((m) => ({ default: m.StudioAnalytics })));
const StudioCourses = lazy(() => import('./pages/Studio').then((m) => ({ default: m.StudioCourses })));
const StudioLives = lazy(() => import('./pages/Studio').then((m) => ({ default: m.StudioLives })));
const StudioQuestions = lazy(() => import('./pages/Studio').then((m) => ({ default: m.StudioQuestions })));
const StudioShell = lazy(() => import('./pages/Studio').then((m) => ({ default: m.StudioShell })));
const ImamatPage = lazy(() => import('./pages/Imamat'));

if (savedTheme() !== 'system') applyTheme(savedTheme());

// فقط نسخهٔ نمایشی: اتاق کلاس زندهٔ شبیه‌سازی‌شده (در سامانه، کلاس روی BigBlueButton باز می‌شود)
const DemoBar = import.meta.env.VITE_DEMO ? lazy(() => import('./demo/DemoBar').then((m) => ({ default: m.DemoBar }))) : null;
const DemoLiveRoom = import.meta.env.VITE_DEMO ? lazy(() => import('./demo/LiveRoom')) : null;

const qc = new QueryClient({
  // هر کاری که خطا داد و خودش پیامی نشان نداد، پیام فارسی سرور را در toast می‌بیند (هیچ خطایی بی‌صدا نمی‌ماند)
  mutationCache: new MutationCache({
    onError: (e, _v, _c, m) => {
      if (m.options.onError || m.meta?.quiet || (e instanceof ApiError && e.code === 'session_expired')) return;
      window.dispatchEvent(new CustomEvent('mh:error', { detail: errorText(e) }));
    },
  }),
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: (n, e) => !(e instanceof ApiError && e.status >= 400 && e.status < 500) && n < 2 },
  },
});

function RequireAuth({ children }: { children: ReactNode }) {
  const { me, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Spinner />;
  if (!me) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  return <>{children}</>;
}
/** کاربر تازه، پیش از هر چیز نقش و مسجدش را می‌گوید (نخستین ورود) */
function RequireOnboard({ children }: { children: ReactNode }) {
  const { me } = useAuth();
  const loc = useLocation();
  // بخش‌های نقشی (راهیار، برگزارکننده، استاد، ستاد) بدون آشنایی اولیه هم باز می‌شوند؛ آشنایی فقط برای نمای کنشگر لازم است
  const roleArea = ['/rahyar', '/pub', '/studio', '/admin', '/settings', '/manage'].some((p) => loc.pathname.startsWith(p));
  if (me && me.onboarded === false && loc.pathname !== '/onboard' && !roleArea) return <Navigate to="/onboard" replace />;
  return <>{children}</>;
}
function RequireStaff({ children }: { children: ReactNode }) {
  const { isStaff } = useAuth();
  return isStaff ? <>{children}</> : <NotFound />;
}

const router = (import.meta.env.VITE_DEMO ? createHashRouter : createBrowserRouter)([
  { path: '/login', element: <Login /> },
  { path: '/verify', element: <VerifyPage /> },
  { path: '/verify/:code', element: <VerifyPage /> },
  { path: '/terms', element: <TermsPage /> },
  { path: '/onboard', element: <RequireAuth><Onboard /></RequireAuth> },
  {
    path: '/studio',
    element: <RequireAuth><StudioShell /></RequireAuth>,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <StudioCourses /> },
      { path: 'questions', element: <StudioQuestions /> },
      { path: 'lives', element: <StudioLives /> },
      { path: 'analytics', element: <StudioAnalytics /> },
      { path: 'courses/:id', element: <CourseEditor /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    path: '/pub',
    element: <RequireAuth><PubShell /></RequireAuth>,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <PubHome /> },
      { path: 'paths/:id', element: <PubPathBuilder /> },
      { path: 'library', element: <PubLibrary /> },
      { path: 'rahyars', element: <PubRahyars /> },
      { path: 'impact', element: <PubImpact /> },
      { path: 'courses/:id', element: <CourseEditor /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  { path: '/b/:token', element: <PublicBoard /> },
  ...(DemoLiveRoom ? [{ path: '/live/:id', element: <RequireAuth><Suspense fallback={<Spinner />}><DemoLiveRoom /></Suspense></RequireAuth> }] : []),
  {
    element: <RequireAuth><RequireOnboard><Shell /></RequireOnboard></RequireAuth>,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/learn', element: <Learn /> },
      { path: '/field', element: <Field /> },
      { path: '/paths/:slug', element: <PathPage /> },
      { path: '/paths/:slug/exam', element: <PathExam /> },
      { path: '/help', element: <Help /> },
      { path: '/tools', element: <Toolbox /> },
      { path: '/peers', element: <PeersPage /> },
      { path: '/gaade/:id', element: <GaadePage /> },
      { path: '/questions/:id', element: <QuestionPage /> },
      { path: '/imamat', element: <ImamatPage /> },
      { path: '/tools/t/:toolId', element: <ToolPage /> },
      { path: '/tools/boards/:id', element: <BoardPage /> },
      { path: '/support/:id', element: <TicketPage /> },
      { path: '/broadcast', element: <BroadcastPage /> },
      { path: '/courses/:slug', element: <Course /> },
      { path: '/lessons/:id', element: <Lesson /> },
      { path: '/review/:id', element: <Review /> },
      { path: '/cohorts/:id', element: <CohortPage /> },
      { path: '/me', element: <Me /> },
      { path: '/settings', element: <Settings /> },
      { path: '/events', element: <Events /> },
      { path: '/campaigns', element: <CampaignList /> },
      { path: '/campaigns/:id', element: <CampaignPage /> },
      { path: '/manage/campaigns', element: <ManageCampaigns /> },
      { path: '/manage/campaigns/new', element: <CampaignEditor /> },
      { path: '/manage/campaigns/:id', element: <ManageCampaign /> },
      { path: '/manage/campaigns/:id/edit', element: <CampaignEditor /> },
      { path: '/events/:id', element: <EventPage /> },
      { path: '/notifications', element: <Notifications /> },
      { path: '/messages', element: <Messages /> },
      { path: '/cores', element: <MyCores /> },
      { path: '/cores/:id', element: <CorePage /> },
      { path: '/join/:code', element: <JoinPage /> },
      { path: '/imam', element: <ImamPage /> },
      { path: '/org', element: <OrgList /> },
      { path: '/org/:id', element: <OrgPage /> },
      { path: '/rahyar', element: <RahyarHome /> },
      { path: '/rahyar/reports', element: <RahyarReports /> },
      { path: '/rahyar/reports/:learnerId/:lessonId', element: <RahyarReport /> },
      { path: '/rahyar/learners', element: <RahyarLearners /> },
      { path: '/rahyar/learners/:id', element: <RahyarLearner /> },
      { path: '/rahyar/messages', element: <RahyarMessages /> },
      { path: '/rahyar/messages/:learnerId', element: <RahyarConversation /> },
      { path: '/rahyar/assign', element: <RahyarAssign /> },
      { path: '/rahyar/tree', element: <RahyarTree /> },
      { path: '/manage/events', element: <ManageEventList /> },
      { path: '/manage/events/new', element: <EventEditor /> },
      { path: '/manage/events/:id', element: <ManageEvent /> },
      { path: '/manage/events/:id/edit', element: <EventEditor /> },
      { path: '/manage/events/:id/checkin', element: <CheckIn /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    path: '/admin',
    element: <RequireAuth><RequireStaff><AdminShell /></RequireStaff></RequireAuth>,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'review', element: <ReviewQueue /> },
      { path: 'publishers', element: <Publishers /> },
      { path: 'courses', element: <Courses /> },
      { path: 'business', element: <AdminBusiness /> },
      { path: 'feedback', element: <FeedbackAdmin /> },
      { path: 'business/:tab', element: <AdminBusiness /> },
      { path: 'courses/:id', element: <CourseEditor /> },
      { path: 'paths', element: <Paths /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'grants', element: <Grants /> },
      { path: 'certificates', element: <Certificates /> },
      { path: 'mosques', element: <Mosques /> },
      { path: 'audit', element: <Audit /> },
      { path: 'rahyar', element: <RahyarTree /> },
      { path: 'support', element: <AdminSupport /> },
      { path: 'support/:id', element: <TicketPage admin /> },
      { path: 'broadcasts', element: <AdminBroadcasts /> },
      { path: 'samples', element: <Samples /> },
      { path: 'tools', element: <ToolsAdmin /> },
      { path: 'security', element: <AccessLogPage /> },
      { path: 'campaigns', element: <ManageCampaigns /> },
      { path: 'campaigns/new', element: <CampaignEditor /> },
      { path: 'campaigns/:id', element: <ManageCampaign /> },
      { path: 'campaigns/:id/edit', element: <CampaignEditor /> },
      { path: 'events', element: <ManageEventList /> },
      { path: 'events/new', element: <EventEditor /> },
      { path: 'events/:id', element: <ManageEvent /> },
      { path: 'events/:id/edit', element: <EventEditor /> },
      { path: 'events/:id/checkin', element: <CheckIn /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <ToastProvider>
          <OfflineBar />
          <Suspense fallback={<Spinner />}><RouterProvider router={router} /></Suspense>
          {DemoBar && <Suspense fallback={null}><DemoBar /></Suspense>}
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
