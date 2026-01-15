import { zodResolver } from "@hookform/resolvers/zod";
import { GraduationCap } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { authAPI } from "@/lib/api";

const formSchema = z.object({
  username: z
    .string()
    .min(1, "Vui lòng nhập email / MSSV / username.")
    .max(100, "Giá trị quá dài."),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự.").max(100, "Giá trị quá dài."),
  remember: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const next = searchParams.get("next");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      remember: true,
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      // Call API to login
      const response = await authAPI.login(values.username, values.password);
      
      toast({
        title: "Đăng nhập thành công",
        description: "Chào mừng bạn quay lại UniReg.",
      });

      // Redirect based on user role or next param
      if (next) {
        navigate(next, { replace: true });
        return;
      }

      // Default redirect based on role
      const role = response.user?.role || 'student';
      if (role === 'admin') {
        navigate("/admin", { replace: true });
      } else if (role === 'lecturer') {
        navigate("/lecturer", { replace: true });
      } else {
        navigate("/student", { replace: true });
      }
    } catch (error: any) {
      toast({
        title: "Đăng nhập thất bại",
        description: error.message || "Email hoặc mật khẩu không đúng",
        variant: "destructive",
      });
    }
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Đăng nhập - UniReg",
    url: window.location.origin + "/login",
    description: "Trang đăng nhập vào hệ thống UniReg dành cho sinh viên, giảng viên và phòng đào tạo.",
    inLanguage: "vi-VN",
  } as const;

  return (
    <main className="app-shell flex min-h-screen items-center justify-center px-4">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-10 md:grid md:grid-cols-[1.2fr_1fr] md:items-center">
        <div className="space-y-6">
          <div className="flex min-h-[200px] items-center justify-center bg-transparent px-0 py-0">
            <img
              src="/uit_logo.png"
              alt="University of Information Technology"
              className="h-28 w-auto object-contain sm:h-36 md:h-44 lg:h-52"
              loading="eager"
              decoding="async"
            />
          </div>

          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">UniReg – Đăng nhập</h1>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              Đăng nhập một lần để truy cập portal theo vai trò. (Bản demo: mọi tài khoản đều hợp lệ.)
            </p>
          </div>

          <dl className="grid max-w-xl grid-cols-2 gap-4 text-xs text-muted-foreground sm:grid-cols-3">
            <div>
              <dt className="stat-label">3 tác nhân</dt>
              <dd className="mt-1 font-semibold text-foreground">SV · GV · PĐT</dd>
            </div>
            <div>
              <dt className="stat-label">Một màn hình</dt>
              <dd className="mt-1 font-semibold text-foreground">Dashboard trực quan</dd>
            </div>
            <div>
              <dt className="stat-label">Bảo mật</dt>
              <dd className="mt-1 font-semibold text-foreground">SSO / Token</dd>
            </div>
          </dl>
        </div>

        <Card className="glass-panel">
          <CardHeader className="space-y-2 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base">Đăng nhập</CardTitle>
                <CardDescription className="truncate">Nhập thông tin tài khoản để truy cập hệ thống.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid gap-3">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email / MSSV</FormLabel>
                        <FormControl>
                          <Input placeholder="vd: 22520001@uit.edu.vn" autoComplete="username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mật khẩu</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" autoComplete="current-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <FormField
                    control={form.control}
                    name="remember"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">Nhớ đăng nhập</FormLabel>
                      </FormItem>
                    )}
                  />

                  <Button type="button" variant="link" className="h-auto p-0 text-xs text-muted-foreground">
                    Quên mật khẩu?
                  </Button>
                </div>

                <Button type="submit" size="lg" className="w-full">
                  Đăng nhập
                </Button>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Chưa có tài khoản?</span>
                  <Button asChild variant="link" className="h-auto p-0 text-xs">
                    <Link to="/login">Liên hệ phòng đào tạo</Link>
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </main>
  );
};

export default Login;


