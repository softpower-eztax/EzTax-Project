import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { Users, Search, Calendar, Mail, User, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
// Remove date-fns import since it's not available

interface AdminUser {
  id: number;
  username: string;
  email?: string;
  displayName?: string;
  googleId?: string;
  createdAt: string;
  lastLogin?: string;
  taxReturnsCount: number;
  status: 'active' | 'inactive';
}

export default function AdminPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const [location, navigate] = useLocation();

  // Check if user has admin privileges
  const isAdmin = user && (user.username === 'admin' || user.username === 'default');

  // Redirect if not admin
  if (user && !isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <CardTitle className="text-red-800">접근 권한 없음</CardTitle>
            </div>
            <CardDescription className="text-red-700">
              관리자 권한이 필요합니다. 이 페이지에 접근할 수 있는 권한이 없습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/')}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              홈페이지로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: users, isLoading, error } = useQuery<AdminUser[]>({
    queryKey: ['/api/admin/users'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isAdmin, // Only fetch if user is admin
  });

  const filteredUsers = users?.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const totalUsers = users?.length || 0;
  const activeUsers = users?.filter(u => u.status === 'active').length || 0;
  const googleUsers = users?.filter(u => u.googleId).length || 0;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">관리자 데이터를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-600 mb-2">관리자 권한 필요</h3>
            <p className="text-gray-600">이 페이지에 접근하려면 관리자 권한이 필요합니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">관리자 패널</h1>
        <p className="text-gray-600">가입 회원 관리 및 통계</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 회원수</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">전체 가입 회원</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 회원</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">활성화된 계정</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">구글 로그인</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{googleUsers}</div>
            <p className="text-xs text-muted-foreground">구글 계정 연동</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            회원 검색
          </CardTitle>
          <CardDescription>사용자명, 이메일, 또는 표시명으로 검색하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="검색어를 입력하세요..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>회원 목록</CardTitle>
          <CardDescription>총 {filteredUsers.length}명의 회원</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>사용자명</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>로그인 방식</TableHead>
                  <TableHead>가입일</TableHead>
                  <TableHead>신고서 수</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.username}</div>
                        {user.displayName && user.displayName !== user.username && (
                          <div className="text-sm text-gray-500">{user.displayName}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.email ? (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      ) : (
                        <span className="text-gray-400">없음</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.googleId ? (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Google
                        </Badge>
                      ) : (
                        <Badge variant="outline">Local</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {user.taxReturnsCount}건
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.status === 'active' ? 'default' : 'secondary'}
                        className={user.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {user.status === 'active' ? '활성' : '비활성'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">회원이 없습니다</h3>
              <p className="text-gray-600">
                {searchTerm ? '검색 조건에 맞는 회원이 없습니다.' : '아직 가입한 회원이 없습니다.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}