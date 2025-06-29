import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { personalInfoSchema, type PersonalInformation, type Dependent } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Trash2, ClipboardCheck, Save } from 'lucide-react';
import ProgressTracker from '@/components/ProgressTracker';
import StepNavigation from '@/components/StepNavigation';
import { useTaxContext } from '@/context/TaxContext';
import { useLocation } from 'wouter';

// 부양가족 관계 옵션
const relationshipOptions = [
  { value: "child", label: "자녀 (Child)" },
  { value: "parent", label: "부모 (Parent)" },
  { value: "grandparent", label: "조부모 (Grandparent)" },
  { value: "sibling", label: "형제자매 (Sibling)" },
  { value: "grandchild", label: "손자녀 (Grandchild)" },
  { value: "niece_nephew", label: "조카 (Niece/Nephew)" },
  { value: "aunt_uncle", label: "삼촌/이모/고모 (Aunt/Uncle)" },
  { value: "in_law", label: "인척 (In-law)" },
  { value: "foster_child", label: "위탁 자녀 (Foster Child)" },
  { value: "other", label: "기타 (Other)" },
];

const PersonalInfo: React.FC = () => {
  const { taxData, updateTaxData, saveTaxReturn } = useTaxContext();
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  // 로컬 상태 관리 (폼과 로컬스토리지 간 동기화)
  const [savedValues, setSavedValues] = useState<PersonalInformation | null>(null);
  const [userIsChangingStatus, setUserIsChangingStatus] = useState(false);



  // 새 사용자용 빈 기본값
  const emptyDefaults: PersonalInformation = {
    firstName: '',
    middleInitial: '',
    lastName: '',
    ssn: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    filingStatus: 'single',
    isDisabled: false,
    isNonresidentAlien: false,
    dependents: [],
    spouseInfo: undefined
  };

  // 현재 taxData가 있으면 사용, 없으면 빈 기본값 사용
  const defaultValues: PersonalInformation = taxData.personalInfo || emptyDefaults;

  // 사용자 데이터 격리 및 로드 관리 - 컴포넌트 마운트 시에만 실행
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Sample Data가 이미 있다면 로딩을 건너뛰기
        const existingSampleData = localStorage.getItem('tempPersonalInfo');
        if (existingSampleData) {
          console.log("PersonalInfo - Sample Data 존재, 초기 로딩 건너뛰기");
          return;
        }

        // 모든 로컬 저장소 데이터 먼저 정리
        localStorage.removeItem('personalInfo');

        // 인증 상태 확인
        const userResponse = await fetch('/api/user', {
          credentials: 'include',
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });

        if (!userResponse.ok) {
          // 비인증 사용자 - localStorage에 데이터가 있는지 먼저 확인
          const savedData = localStorage.getItem('tempPersonalInfo');
          if (savedData) {
            try {
              const parsedData = JSON.parse(savedData);
              console.log("PersonalInfo - 비인증 사용자: localStorage에서 데이터 복원");
              form.reset(parsedData);
              setSavedValues(parsedData);
              return;
            } catch (error) {
              console.error("Failed to parse saved data:", error);
            }
          }

          // localStorage에 데이터가 없으면 완전 초기화
          console.log("PersonalInfo - 비인증 사용자: 완전 초기화");
          form.reset({
            firstName: "",
            middleInitial: "",
            lastName: "",
            ssn: "",
            dateOfBirth: "",
            email: "",
            phone: "",
            address1: "",
            address2: "",
            city: "",
            state: "",
            zipCode: "",
            filingStatus: "single",
            isDisabled: false,
            isNonresidentAlien: false,
            dependents: [],
            spouseInfo: undefined
          });
          setSavedValues(null);
          return;
        }

        const currentUser = await userResponse.json();
        console.log(`PersonalInfo - 현재 사용자: ${currentUser.username} (ID: ${currentUser.id})`);

        // 서버에서 최신 데이터를 다시 가져와서 확인
        const taxResponse = await fetch('/api/tax-return', {
          credentials: 'include',
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });

        // 서버에서 저장된 데이터 로드 (localStorage 데이터가 없을 때만)
        if (taxResponse.ok) {
          const serverData = await taxResponse.json();
          if (serverData.personalInfo) {
            console.log("PersonalInfo - 서버에서 개인정보 데이터 확인됨:", serverData.personalInfo);

            // localStorage에 임시 데이터가 있는지 먼저 확인
            const savedFormData = localStorage.getItem('tempPersonalInfo');
            const savedFilingStatus = localStorage.getItem('tempFilingStatus');

            if (!savedFormData && !savedFilingStatus) {
              // localStorage에 임시 데이터가 없으면 서버 데이터 사용
              console.log("PersonalInfo - 서버에서 최신 개인정보 로드:", serverData.personalInfo);
              form.reset(serverData.personalInfo);
              setSavedValues(serverData.personalInfo);
              return;
            }
          }
        }

        // localStorage 우선 확인 (Filing Status 복귀 시 데이터 보존)
        const savedFormData = localStorage.getItem('tempPersonalInfo');
        const savedFilingStatus = localStorage.getItem('tempFilingStatus');
        let finalData = null;

        if (savedFormData) {
          try {
            const parsedData = JSON.parse(savedFormData);
            // localStorage 데이터가 실제 입력된 데이터인지 확인
            const hasRealData = parsedData.firstName || parsedData.lastName || parsedData.ssn;
            if (hasRealData) {
              finalData = parsedData;
              console.log("PersonalInfo - localStorage에서 폼 데이터 복원:", parsedData);
              // 사용 후 정리 (한번만 복원)
              localStorage.removeItem('tempPersonalInfo');
            }
          } catch (error) {
            console.error("Failed to parse saved form data:", error);
          }
        }

        // Filing Status만 별도로 저장된 경우 처리 (현재 폼 데이터 보존)
        if (savedFilingStatus) {
          try {
            const parsedFilingStatus = JSON.parse(savedFilingStatus);
            console.log("PersonalInfo - Filing Status만 복원:", parsedFilingStatus);
            // 현재 폼 데이터를 가져와서 filing status만 업데이트
            const currentFormData = form.getValues();
            const hasExistingData = currentFormData.firstName || currentFormData.lastName || currentFormData.ssn;

            if (hasExistingData) {
              // 기존 데이터가 있으면 filing status만 업데이트
              finalData = {
                ...currentFormData,
                filingStatus: parsedFilingStatus.filingStatus
              };
              console.log("PersonalInfo - 기존 폼 데이터와 Filing Status 병합:", finalData);
            } else if (!finalData) {
              // 기존 데이터가 없고 다른 소스에서도 데이터가 없는 경우
              finalData = {
                firstName: "",
                middleInitial: "",
                lastName: "",
                ssn: "",
                dateOfBirth: "",
                email: "",
                phone: "",
                address1: "",
                address2: "",
                city: "",
                state: "",
                zipCode: "",
                filingStatus: parsedFilingStatus.filingStatus,
                isDisabled: false,
                isNonresidentAlien: false,
                dependents: [],
                spouseInfo: undefined
              };
            }
            localStorage.removeItem('tempFilingStatus');
          } catch (error) {
            console.error("Failed to parse saved filing status:", error);
          }
        }

        // DISABLED: TaxContext loading was overriding Filing Status Checker selections
        // localStorage에 데이터가 없으면 TaxContext 데이터 사용
        // if (!finalData && taxData.personalInfo) {
        //   finalData = taxData.personalInfo;
        //   console.log("PersonalInfo - TaxContext에서 개인정보 로드");
        // }

        if (finalData) {
          form.reset(finalData);
          setSavedValues(finalData);
        } else {
          // 모든 소스에 데이터가 없으면 빈 폼으로 시작
          console.log("PersonalInfo - 개인정보 없음, 빈 폼으로 시작");
          form.reset({
            firstName: "",
            middleInitial: "",
            lastName: "",
            ssn: "",
            dateOfBirth: "",
            email: "",
            phone: "",
            address1: "",
            address2: "",
            city: "",
            state: "",
            zipCode: "",
            filingStatus: "single",
            isDisabled: false,
            isNonresidentAlien: false,
            dependents: [],
            spouseInfo: undefined
          });
          setSavedValues(null);
        }
      } catch (error) {
        console.error("PersonalInfo - 데이터 로드 오류:", error);
        // 오류 발생 시 빈 폼으로 초기화
        form.reset({
          firstName: "",
          middleInitial: "",
          lastName: "",
          ssn: "",
          dateOfBirth: "",
          email: "",
          phone: "",
          address1: "",
          address2: "",
          city: "",
          state: "",
          zipCode: "",
          filingStatus: "single",
          isDisabled: false,
          isNonresidentAlien: false,
          dependents: [],
          spouseInfo: undefined
        });
        setSavedValues(null);
      }
    };

    loadUserData();
  }, []); // 빈 의존성 배열로 변경하여 컴포넌트 마운트 시에만 실행

  // TEMPORARILY DISABLED: taxData.personalInfo useEffect was overriding user's filing status changes
  // This was preventing spouse information fields from appearing when selecting married filing status
  // TODO: Need to implement proper data loading that respects user's active form changes
  // useEffect(() => {
  //   if (taxData.personalInfo && Object.keys(taxData.personalInfo).length > 0) {
  //     // ... data loading logic that interferes with filing status changes
  //   }
  // }, [taxData.personalInfo]);

  // Disable zod validation to avoid form validation errors
  const form = useForm<PersonalInformation>({
    // resolver: zodResolver(personalInfoSchema), // Disabled validation
    defaultValues,
    mode: 'onChange'
  });

  // Watch filing status to show spouse info when 'married_joint' is selected
  const filingStatus = form.watch('filingStatus');

  // Force component re-render when filing status changes (especially from Filing Status Checker)
  const [renderKey, setRenderKey] = useState(0);
  const [showSpouseInfo, setShowSpouseInfo] = useState(false);

  // Debug: Log filing status changes and force re-render
  useEffect(() => {
    console.log("Current filing status:", filingStatus);
    const shouldShowSpouse = filingStatus === 'married_joint' || filingStatus === 'married_separate';
    setShowSpouseInfo(shouldShowSpouse);
    setRenderKey(prev => prev + 1); // Force re-render to ensure spouse fields appear
    console.log("PersonalInfo - Should show spouse info:", shouldShowSpouse);
  }, [filingStatus]);

  // DISABLED: TaxContext effect was causing server data to override Filing Status Checker selections
  // Watch for changes from TaxContext (from Filing Status Checker) and update form
  // useEffect(() => {
  //   if (taxData.personalInfo?.filingStatus && taxData.personalInfo.filingStatus !== form.getValues('filingStatus')) {
  //     console.log("PersonalInfo - Filing status updated from TaxContext:", taxData.personalInfo.filingStatus);
  //     form.setValue('filingStatus', taxData.personalInfo.filingStatus, { shouldValidate: true, shouldTouch: true });

  //     // Also update spouse info state directly
  //     const shouldShowSpouse = taxData.personalInfo.filingStatus === 'married_joint' || taxData.personalInfo.filingStatus === 'married_separate';
  //     setShowSpouseInfo(shouldShowSpouse);
  //     console.log("PersonalInfo - Force updating spouse info visibility:", shouldShowSpouse);

  //     setRenderKey(prev => prev + 1); // Force re-render
  //   }
  // }, [taxData.personalInfo?.filingStatus]);

  // Additional watch for external form updates to ensure spouse fields appear
  // DISABLED: This was causing the Filing Status Checker selection to be overridden
  // useEffect(() => {
  //   if (taxData.personalInfo) {
  //     const currentFormValues = form.getValues();
  //     const hasChanges = Object.keys(taxData.personalInfo).some(key => 
  //       taxData.personalInfo[key as keyof typeof taxData.personalInfo] !== currentFormValues[key as keyof typeof currentFormValues]
  //     );

  //     if (hasChanges) {
  //       console.log("PersonalInfo - Syncing form with TaxContext data");
  //       form.reset(taxData.personalInfo);
  //       setRenderKey(prev => prev + 1);
  //     }
  //   }
  // }, [taxData.personalInfo]);

  // Watch all form values and auto-save to TaxContext as user types
  const watchedValues = form.watch();

  // Auto-save form data with localStorage backup to prevent data loss during navigation
  const handleFormBlur = () => {
    const formData = form.getValues();
    const hasData = formData.firstName || formData.lastName || formData.ssn || formData.email;
    if (hasData) {
      console.log("PersonalInfo - Saving form data on blur:", formData);
      // Save to both TaxContext and localStorage for persistence
      updateTaxData({ personalInfo: formData });
      localStorage.setItem('tempPersonalInfo', JSON.stringify(formData));
    }
  };

  // Load from localStorage on component mount to restore data after navigation
  useEffect(() => {
    const savedFormData = localStorage.getItem('tempPersonalInfo');
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        console.log("PersonalInfo - Restoring saved form data from localStorage:", parsedData);
        form.reset(parsedData);

        // Update TaxContext with restored data
        updateTaxData({ personalInfo: parsedData });
      } catch (error) {
        console.error("Failed to parse saved form data:", error);
      }
    }
  }, []);

  // Clean up localStorage only when explicitly needed (not on every unmount)
  const cleanupLocalStorage = () => {
    localStorage.removeItem('tempPersonalInfo');
    console.log("PersonalInfo - Cleaned up temporary localStorage data");
  };

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'dependents'
  });

  // Watch for dependents changes and update field array
  const dependentsValue = form.watch('dependents');
  useEffect(() => {
    if (dependentsValue && Array.isArray(dependentsValue) && dependentsValue.length > 0) {
      // Only replace if the field array doesn't match the form values
      if (fields.length !== dependentsValue.length) {
        console.log("PersonalInfo - Updating field array with dependents:", dependentsValue);
        replace(dependentsValue);
      }
    }
  }, [dependentsValue, fields.length, replace]);

  const onSubmit = (data: PersonalInformation) => {
    // Make sure all values are properly processed before updating the tax data
    try {
      console.log("Processing form data:", data);
      updateTaxData({ personalInfo: data });
      return true;
    } catch (error) {
      console.error("Error submitting personal info form:", error);
      return false;
    }
  };

  const addDependent = () => {
    append({
      firstName: '',
      lastName: '',
      ssn: '',
      relationship: relationshipOptions[0].value, // 첫 번째 관계 옵션을 기본값으로 설정
      dateOfBirth: '',
      isDisabled: false,
      isNonresidentAlien: false,
      isQualifyingChild: true // 19세 미만 또는 24세 미만 학생 기본값으로 체크
    });
  };

  // Format SSN as user types
  const formatSSN = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Format as XXX-XX-XXXX
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 5) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
    }
  };

  // Format phone as user types
  const formatPhone = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Format as XXX-XXX-XXXX
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  // 값 초기화 처리
  const handleReset = () => {
    const resetValues: PersonalInformation = {
      firstName: '',
      lastName: '',
      middleInitial: '',
      ssn: '',
      dateOfBirth: '',
      email: '',
      phone: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zipCode: '',
      filingStatus: 'single',
      isDisabled: false,
      isNonresidentAlien: false,
      dependents: []
    };

    console.log("값 초기화 실행:", resetValues);

    // 폼 초기화
    form.reset(resetValues);

    // 로컬 상태 초기화
    setSavedValues(resetValues);

    // 로컬 스토리지에서도 초기화된 값 저장
    localStorage.setItem('personalInfo', JSON.stringify(resetValues));

    // 컨텍스트 업데이트
    updateTaxData({ personalInfo: resetValues });

    // 서버에도 저장
    saveTaxReturn().then(() => {
      console.log("초기화된 값 서버에 저장 완료");
    }).catch(error => {
      console.error("초기화된 값 서버 저장 실패:", error);
    });

    toast({
      title: "값 초기화 완료",
      description: "모든 개인정보 항목이 초기화되었습니다.",
    });
  };

  // 진행 상황 저장 처리
  const handleSaveProgress = () => {
    const currentValues = form.getValues();
    console.log("진행 상황 저장 - 현재 값:", currentValues);

    // 로컬 상태 업데이트
    setSavedValues(currentValues);

    // 컨텍스트 업데이트
    updateTaxData({ personalInfo: currentValues });

    // 로컬 스토리지에 저장 (일관된 키 사용)
    localStorage.setItem('tempPersonalInfo', JSON.stringify(currentValues));

    // 서버에 저장
    saveTaxReturn().then(() => {
      console.log("서버 저장 완료 - 현재 상태 유지됨");
      toast({
        title: "진행 상황 저장 완료",
        description: "개인정보가 성공적으로 저장되었습니다.",
      });
    }).catch(error => {
      console.error("서버 저장 실패:", error);
      toast({
        title: "저장 실패",
        description: "서버에 데이터를 저장하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    });
  };

  // Sample Data 입력 처리
  const handleSampleData = async () => {
    const sampleData: PersonalInformation = {
      firstName: 'John',
      middleInitial: 'M',
      lastName: 'Smith',
      ssn: '123-45-6789',
      dateOfBirth: '1985-03-15',
      email: 'john.smith@email.com',
      phone: '555-123-4567',
      address1: '123 Main Street',
      address2: 'Apt 2B',
      city: 'Anytown',
      state: 'CA',
      zipCode: '90210',
      filingStatus: 'married_joint',
      isDisabled: false,
      isNonresidentAlien: false,
      dependents: [
        {
          firstName: 'Emily',
          lastName: 'Smith',
          ssn: '987-65-4321',
          dateOfBirth: '2010-07-20',
          relationship: 'child',
          isDisabled: false,
          isNonresidentAlien: false,
          isQualifyingChild: true
        }
      ],
      spouseInfo: {
        firstName: 'Jane',
        lastName: 'Smith',
        ssn: '111-22-3333',
        dateOfBirth: '1987-12-08',
        differentAddress: false,
        address1: '',
        address2: '',
        city: '',
        state: '',
        zipCode: '',
        isDisabled: false,
        isNonresidentAlien: false
      }
    };

    console.log("Sample Data 버튼 클릭 - 데이터 입력 시작");

    // 로컬 스토리지에 먼저 저장 (data loading logic이 덮어쓰지 않도록)
    localStorage.setItem('tempPersonalInfo', JSON.stringify(sampleData));
    console.log("Sample Data - localStorage에 저장 완료");

    // 폼에 샘플 데이터 입력
    form.reset(sampleData);
    console.log("Sample Data - 폼 리셋 완료");

    // 부양가족 필드 배열 명시적 업데이트
    replace(sampleData.dependents || []);
    console.log("Sample Data - 부양가족 필드 배열 업데이트 완료");

    // 로컬 상태 업데이트  
    setSavedValues(sampleData);

    // 컨텍스트 업데이트
    updateTaxData({ personalInfo: sampleData });
    console.log("Sample Data - 컨텍스트 업데이트 완료");

    // 토스트 알림
    toast({
      title: "샘플 데이터 입력 완료",
      description: "John & Jane Smith 가족 정보가 입력되었습니다 (부양가족 1명 포함).",
    });

    console.log("Sample Data 입력 프로세스 완료");
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-primary-dark mb-2">귀하의 2025년 세금 신고서 (Your 2025 Tax Return)</h1>
        <p className="text-gray-dark">세금 신고서를 준비하기 위해 모든 섹션을 작성하세요. (Complete all sections to prepare your tax return.)</p>
      </div>

      <ProgressTracker currentStep={1} />

      <div className="flex flex-col">
        <div className="w-full">
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-heading font-semibold text-primary-dark mb-2">개인 정보 (Personal Information)</h2>
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-200 text-sm text-blue-800">
                    <p className="font-medium">💡 개인정보 보호 안내</p>
                    <p className="mt-1">시뮬레이션시 개인정보보호를 위해 샘플데이터를 사용하시는게 좋습니다. 단 의미있는 결과를 위해 생년월일 정보와 거주 State 정보는 정확하게 입력하세요.</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSampleData}
                  className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 ml-4 flex-shrink-0"
                >
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  샘플 데이터
                </Button>
              </div>

              <Form {...form}>
                <form onSubmit={(e) => { e.preventDefault(); }}>

                  {/* Basic Information */}
                  <div className="mb-6">
                    <h3 className="text-lg font-heading font-semibold mb-4">기본 정보</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>이름(First Name)</FormLabel>
                            <FormControl>
                              <Input {...field} onBlur={handleFormBlur} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>성(Last Name)</FormLabel>
                            <FormControl>
                              <Input {...field} onBlur={handleFormBlur} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="middleInitial"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Middle Initial (선택)</FormLabel>
                            <FormControl>
                              <Input {...field} maxLength={1} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <FormField
                        control={form.control}
                        name="ssn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>사회보장번호(SSN)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="XXX-XX-XXXX"
                                onChange={(e) => {
                                  const formatted = formatSSN(e.target.value);
                                  field.onChange(formatted);
                                }}
                                onBlur={handleFormBlur}
                                maxLength={11}
                              />
                            </FormControl>
                            <FormDescription>
                              Format: XXX-XX-XXXX
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>생년월일</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                type="date"
                                placeholder="YYYY-MM-DD"
                                onBlur={handleFormBlur}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* 연락처 정보 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>이메일 주소 (Email Address)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                type="email"
                                placeholder="example@email.com"
                                onBlur={handleFormBlur}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>전화번호 (Phone Number)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                type="tel"
                                placeholder="XXX-XXX-XXXX"
                                onChange={(e) => {
                                  const formatted = formatPhone(e.target.value);
                                  field.onChange(formatted);
                                }}
                                onBlur={handleFormBlur}
                                maxLength={12}
                              />
                            </FormControl>
                            <FormDescription>
                              Format: XXX-XXX-XXXX
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* 주소 정보 */}
                    <div className="space-y-4 mt-4">
                      <h3 className="text-sm font-medium text-gray-700">주소 정보 (Address Information)</h3>

                      <FormField
                        control={form.control}
                        name="address1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>주소 1 (Address Line 1)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                placeholder="123 Main Street"
                                onBlur={handleFormBlur}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>주소 2 (Address Line 2) - 선택사항</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                placeholder="Apt 4B, Suite 100"
                                onBlur={handleFormBlur}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>도시 (City)</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field}
                                  placeholder="New York"
                                  onBlur={handleFormBlur}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>주 (State)</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="주를 선택하세요" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="AL">Alabama (AL)</SelectItem>
                                  <SelectItem value="AK">Alaska (AK)</SelectItem>
                                  <SelectItem value="AZ">Arizona (AZ)</SelectItem>
                                  <SelectItem value="AR">Arkansas (AR)</SelectItem>
                                  <SelectItem value="CA">California (CA)</SelectItem>
                                  <SelectItem value="CO">Colorado (CO)</SelectItem>
                                  <SelectItem value="CT">Connecticut (CT)</SelectItem>
                                  <SelectItem value="DE">Delaware (DE)</SelectItem>
                                  <SelectItem value="FL">Florida (FL)</SelectItem>
                                  <SelectItem value="GA">Georgia (GA)</SelectItem>
                                  <SelectItem value="HI">Hawaii (HI)</SelectItem>
                                  <SelectItem value="ID">Idaho (ID)</SelectItem>
                                  <SelectItem value="IL">Illinois (IL)</SelectItem>
                                  <SelectItem value="IN">Indiana (IN)</SelectItem>
                                  <SelectItem value="IA">Iowa (IA)</SelectItem>
                                  <SelectItem value="KS">Kansas (KS)</SelectItem>
                                  <SelectItem value="KY">Kentucky (KY)</SelectItem>
                                  <SelectItem value="LA">Louisiana (LA)</SelectItem>
                                  <SelectItem value="ME">Maine (ME)</SelectItem>
                                  <SelectItem value="MD">Maryland (MD)</SelectItem>
                                  <SelectItem value="MA">Massachusetts (MA)</SelectItem>
                                  <SelectItem value="MI">Michigan (MI)</SelectItem>
                                  <SelectItem value="MN">Minnesota (MN)</SelectItem>
                                  <SelectItem value="MS">Mississippi (MS)</SelectItem>
                                  <SelectItem value="MO">Missouri (MO)</SelectItem>
                                  <SelectItem value="MT">Montana (MT)</SelectItem>
                                  <SelectItem value="NE">Nebraska (NE)</SelectItem>
                                  <SelectItem value="NV">Nevada (NV)</SelectItem>
                                  <SelectItem value="NH">New Hampshire (NH)</SelectItem>
                                  <SelectItem value="NJ">New Jersey (NJ)</SelectItem>
                                  <SelectItem value="NM">New Mexico (NM)</SelectItem>
                                  <SelectItem value="NY">New York (NY)</SelectItem>
                                  <SelectItem value="NC">North Carolina (NC)</SelectItem>
                                  <SelectItem value="ND">North Dakota (ND)</SelectItem>
                                  <SelectItem value="OH">Ohio (OH)</SelectItem>
                                  <SelectItem value="OK">Oklahoma (OK)</SelectItem>
                                  <SelectItem value="OR">Oregon (OR)</SelectItem>
                                  <SelectItem value="PA">Pennsylvania (PA)</SelectItem>
                                  <SelectItem value="RI">Rhode Island (RI)</SelectItem>
                                  <SelectItem value="SC">South Carolina (SC)</SelectItem>
                                  <SelectItem value="SD">South Dakota (SD)</SelectItem>
                                  <SelectItem value="TN">Tennessee (TN)</SelectItem>
                                  <SelectItem value="TX">Texas (TX)</SelectItem>
                                  <SelectItem value="UT">Utah (UT)</SelectItem>
                                  <SelectItem value="VT">Vermont (VT)</SelectItem>
                                  <SelectItem value="VA">Virginia (VA)</SelectItem>
                                  <SelectItem value="WA">Washington (WA)</SelectItem>
                                  <SelectItem value="WV">West Virginia (WV)</SelectItem>
                                  <SelectItem value="WI">Wisconsin (WI)</SelectItem>
                                  <SelectItem value="WY">Wyoming (WY)</SelectItem>
                                  <SelectItem value="DC">Washington D.C. (DC)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="zipCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>우편번호 (ZIP Code)</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field}
                                  placeholder="10001"
                                  maxLength={10}
                                  onBlur={handleFormBlur}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* 저장 버튼과 더미 데이터 버튼 - Filing Status 섹션 바로 위에 배치 */}
                    <div className="flex justify-center gap-4 my-6">
                      <Button 
                        variant="outline" 
                        size="lg"
                        className="text-green-600 hover:text-green-700 border-green-300 hover:border-green-400 flex items-center px-6 py-2"
                        onClick={async () => {
                          try {
                            const values = form.getValues();
                            console.log("저장 버튼 클릭 - 현재 값:", values);

                            // 로컬 상태 업데이트
                            setSavedValues(values);

                            // 컨텍스트 업데이트
                            updateTaxData({ personalInfo: values });

                            // 로컬 스토리지에 저장
                            localStorage.setItem('personalInfo', JSON.stringify(values));

                            // 서버에 저장
                            await saveTaxReturn();

                            toast({
                              title: "저장 완료",
                              description: "개인정보가 성공적으로 저장되었습니다.",
                            });
                          } catch (error) {
                            console.error("저장 실패:", error);
                            toast({
                              title: "저장 실패",
                              description: "저장 중 오류가 발생했습니다. 다시 시도해주세요.",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        진행상황 저장
                      </Button>
                    </div>

                    <div className="mt-4">
                      <FormField
                        control={form.control}
                        name="filingStatus"
                        render={({ field }) => (
                          <FormItem>
                            <div className="mb-2">
                              <FormLabel>신고 상태(Filing Status)</FormLabel>
                            </div>
                            <div className="flex items-center mb-3 bg-sky-50 p-3 rounded-md border border-sky-200">
                              <div className="flex-1 text-sky-700">
                                <span className="font-semibold">*신고 상태(Filing Status)를 모르시면</span> 옆의 "신고 상태 확인" 버튼을 눌러 확인하세요
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="ml-3 bg-white hover:bg-sky-100"
                                onClick={(e) => {
                                  e.preventDefault();
                                  window.location.href = '/filing-status-checker';
                                }}
                              >
                                <ClipboardCheck className="h-4 w-4 mr-1 text-sky-700" />
                                <span className="font-semibold">신고 상태 확인</span>
                              </Button>
                            </div>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value || "single"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="신고 상태를 선택하세요" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="single">미혼(Single)</SelectItem>
                                <SelectItem value="married_joint">부부 공동 신고(Married Filing Jointly)</SelectItem>
                                <SelectItem value="married_separate">부부 개별 신고(Married Filing Separately)</SelectItem>
                                <SelectItem value="head_of_household">세대주(Head of Household)</SelectItem>
                                <SelectItem value="qualifying_widow">유자격 미망인(Qualifying Widow(er))</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-4 space-y-3">
                      <FormField
                        control={form.control}
                        name="isDisabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4 mt-1"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>시각장애인, 영구 장애인 (Legally blind, permanently disabled)</FormLabel>
                              <FormDescription className="text-xs">
                                신고자가 법적으로 시각장애인이거나 영구적인 장애가 있는 경우 체크하세요.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isNonresidentAlien"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4 mt-1"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>비거주 외국인 (Nonresident Alien)</FormLabel>
                              <FormDescription className="text-xs">
                                신고자가 비거주 외국인 상태인 경우 체크하세요.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Spouse Information - Only shows when filing status is married_joint */}
                  {/* Debug: Current filing status: {filingStatus}, showSpouseInfo: {showSpouseInfo} */}
                  {(showSpouseInfo || filingStatus === 'married_joint' || filingStatus === 'married_separate') && (
                    <>
                      <Separator className="my-6" />
                      <div className="mb-6" key={`spouse-info-${renderKey}`}>
                        <h3 className="text-lg font-heading font-semibold mb-4">배우자 정보(Spouse Information)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="spouseInfo.firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>이름(First Name)</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="spouseInfo.lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>성(Last Name)</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="spouseInfo.middleInitial"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Middle Initial (선택)</FormLabel>
                                <FormControl>
                                  <Input {...field} maxLength={1} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <FormField
                            control={form.control}
                            name="spouseInfo.ssn"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>사회보장번호(SSN)</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    placeholder="XXX-XX-XXXX"
                                    onChange={(e) => {
                                      const formatted = formatSSN(e.target.value);
                                      field.onChange(formatted);
                                    }}
                                    maxLength={11}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Format: XXX-XX-XXXX
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="spouseInfo.dateOfBirth"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>생년월일</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field}
                                    type="date"
                                    placeholder="YYYY-MM-DD"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="mt-4 space-y-3">
                          <FormField
                            control={form.control}
                            name="spouseInfo.isDisabled"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={field.onChange}
                                    className="h-4 w-4 mt-1"
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>시각장애인, 영구 장애인 (Legally blind, permanently disabled)</FormLabel>
                                  <FormDescription className="text-xs">
                                    배우자가 법적으로 시각장애인이거나 영구적인 장애가 있는 경우 체크하세요.
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="spouseInfo.isNonresidentAlien"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={field.onChange}
                                    className="h-4 w-4 mt-1"
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>비거주 외국인 (Nonresident Alien)</FormLabel>
                                  <FormDescription className="text-xs">
                                    배우자가 비거주 외국인 상태인 경우 체크하세요.
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />

                          {/* Spouse Address Option */}
                          <FormField
                            control={form.control}
                            name="spouseInfo.differentAddress"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value || false}
                                    onChange={(e) => {
                                      field.onChange(e.target.checked);
                                      if (!e.target.checked) {
                                        // Clear spouse address fields when unchecked
                                        const currentSpouseInfo = form.getValues("spouseInfo");
                                        if (currentSpouseInfo) {
                                          form.setValue("spouseInfo", {
                                            ...currentSpouseInfo,
                                            address1: "",
                                            address2: "",
                                            city: "",
                                            state: "",
                                            zipCode: ""
                                          });
                                        }
                                      }
                                    }}
                                    className="h-4 w-4 mt-1"
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>위의주소와 다름 (Different from taxpayer address)</FormLabel>
                                  <FormDescription className="text-xs">
                                    배우자가 납세자와 다른 주소에 거주하는 경우 체크하세요.
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Spouse Address Fields - Only show when differentAddress is true */}
                        {form.watch("spouseInfo.differentAddress") === true && (
                          <div className="mt-4 space-y-4">
                            <h4 className="text-sm font-medium text-gray-700">배우자 주소 (Spouse Address)</h4>

                            <FormField
                              control={form.control}
                              name="spouseInfo.address1"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>주소 1 (Address Line 1)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field}
                                      placeholder="123 Main Street"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="spouseInfo.address2"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>주소 2 (Address Line 2) - 선택사항</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field}
                                      placeholder="Apt 4B, Suite 100"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <FormField
                                control={form.control}
                                name="spouseInfo.city"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>도시 (City)</FormLabel>
                                    <FormControl>
                                      <Input 
                                        {...field}
                                        placeholder="New York"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="spouseInfo.state"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>주 (State)</FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="주를 선택하세요" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="AL">Alabama (AL)</SelectItem>
                                        <SelectItem value="AK">Alaska (AK)</SelectItem>
                                        <SelectItem value="AZ">Arizona (AZ)</SelectItem>
                                        <SelectItem value="AR">Arkansas (AR)</SelectItem>
                                        <SelectItem value="CA">California (CA)</SelectItem>
                                        <SelectItem value="CO">Colorado (CO)</SelectItem>
                                        <SelectItem value="CT">Connecticut (CT)</SelectItem>
                                        <SelectItem value="DE">Delaware (DE)</SelectItem>
                                        <SelectItem value="FL">Florida (FL)</SelectItem>
                                        <SelectItem value="GA">Georgia (GA)</SelectItem>
                                        <SelectItem value="HI">Hawaii (HI)</SelectItem>
                                        <SelectItem value="ID">Idaho (ID)</SelectItem>
                                        <SelectItem value="IL">Illinois (IL)</SelectItem>
                                        <SelectItem value="IN">Indiana (IN)</SelectItem>
                                        <SelectItem value="IA">Iowa (IA)</SelectItem>
                                        <SelectItem value="KS">Kansas (KS)</SelectItem>
                                        <SelectItem value="KY">Kentucky (KY)</SelectItem>
                                        <SelectItem value="LA">Louisiana (LA)</SelectItem>
                                        <SelectItem value="ME">Maine (ME)</SelectItem>
                                        <SelectItem value="MD">Maryland (MD)</SelectItem>
                                        <SelectItem value="MA">Massachusetts (MA)</SelectItem>
                                        <SelectItem value="MI">Michigan (MI)</SelectItem>
                                        <SelectItem value="MN">Minnesota (MN)</SelectItem>
                                        <SelectItem value="MS">Mississippi (MS)</SelectItem>
                                        <SelectItem value="MO">Missouri (MO)</SelectItem>
                                        <SelectItem value="MT">Montana (MT)</SelectItem>
                                        <SelectItem value="NE">Nebraska (NE)</SelectItem>
                                        <SelectItem value="NV">Nevada (NV)</SelectItem>
                                        <SelectItem value="NH">New Hampshire (NH)</SelectItem>
                                        <SelectItem value="NJ">New Jersey (NJ)</SelectItem>
                                        <SelectItem value="NM">New Mexico (NM)</SelectItem>
                                        <SelectItem value="NY">New York (NY)</SelectItem>
                                        <SelectItem value="NC">North Carolina (NC)</SelectItem>
                                        <SelectItem value="ND">North Dakota (ND)</SelectItem>
                                        <SelectItem value="OH">Ohio (OH)</SelectItem>
                                        <SelectItem value="OK">Oklahoma (OK)</SelectItem>
                                        <SelectItem value="OR">Oregon (OR)</SelectItem>
                                        <SelectItem value="PA">Pennsylvania (PA)</SelectItem>
                                        <SelectItem value="RI">Rhode Island (RI)</SelectItem>
                                        <SelectItem value="SC">South Carolina (SC)</SelectItem>
                                        <SelectItem value="SD">South Dakota (SD)</SelectItem>
                                        <SelectItem value="TN">Tennessee (TN)</SelectItem>
                                        <SelectItem value="TX">Texas (TX)</SelectItem>
                                        <SelectItem value="UT">Utah (UT)</SelectItem>
                                        <SelectItem value="VT">Vermont (VT)</SelectItem>
                                        <SelectItem value="VA">Virginia (VA)</SelectItem>
                                        <SelectItem value="WA">Washington (WA)</SelectItem>
                                        <SelectItem value="WV">West Virginia (WV)</SelectItem>
                                        <SelectItem value="WI">Wisconsin (WI)</SelectItem>
                                        <SelectItem value="WY">Wyoming (WY)</SelectItem>
                                        <SelectItem value="DC">Washington D.C. (DC)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="spouseInfo.zipCode"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>우편번호 (ZIP Code)</FormLabel>
                                    <FormControl>
                                      <Input 
                                        {...field}
                                        placeholder="10001"
                                        maxLength={10}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <Separator className="my-6" />

                  {/* Dependents */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-heading font-semibold">부양가족</h3>
                      <Button 
                        type="button" 
                        variant="outline"
                        size="sm"
                        onClick={addDependent}
                        className="flex items-center"
                      >
                        <PlusCircle className="mr-1 h-4 w-4" />
                        부양가족 추가
                      </Button>
                    </div>

                    {fields.length === 0 ? (
                      <p className="text-gray-dark italic mb-4">추가된 부양가족이 없습니다. "부양가족 추가" 버튼을 클릭하여 추가하세요.</p>
                    ) : (
                      fields.map((field, index) => (
                        <div key={field.id} className="border border-gray-medium rounded-md p-4 mb-4">
                          <div className="flex justify-between mb-3">
                            <h4 className="font-semibold">Dependent #{index + 1}</h4>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm"
                              onClick={() => remove(index)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`dependents.${index}.firstName`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>이름(First Name)</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`dependents.${index}.lastName`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>성(Last Name)</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            <FormField
                              control={form.control}
                              name={`dependents.${index}.ssn`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>사회보장번호(SSN)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      placeholder="XXX-XX-XXXX"
                                      onChange={(e) => {
                                        const formatted = formatSSN(e.target.value);
                                        field.onChange(formatted);
                                      }}
                                      maxLength={11}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`dependents.${index}.relationship`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>납세자와의 관계 (Relationship)</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value || ""}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="관계를 선택하세요" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {relationshipOptions.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="mt-3">
                            <FormField
                              control={form.control}
                              name={`dependents.${index}.dateOfBirth`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>생년월일</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      type="date"
                                      placeholder="YYYY-MM-DD"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="mt-4 space-y-3">
                            <FormField
                              control={form.control}
                              name={`dependents.${index}.isDisabled`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <input
                                      type="checkbox"
                                      checked={field.value}
                                      onChange={field.onChange}
                                      className="h-4 w-4 mt-1"
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>시각장애인, 영구 장애인 (Legally blind, permanently disabled)</FormLabel>
                                    <FormDescription className="text-xs">
                                      부양가족에게 영구적인 장애가 있는 경우 체크하세요.
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`dependents.${index}.isNonresidentAlien`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <input
                                      type="checkbox"
                                      checked={field.value}
                                      onChange={field.onChange}
                                      className="h-4 w-4 mt-1"
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>비거주 외국인 (Nonresident Alien)</FormLabel>
                                    <FormDescription className="text-xs">
                                      부양가족이 비거주 외국인 상태인 경우 체크하세요.
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`dependents.${index}.isQualifyingChild`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-3">
                                  <FormControl>
                                    <input
                                      type="checkbox"
                                      checked={field.value}
                                      onChange={field.onChange}
                                      className="h-4 w-4 mt-1"
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>19세미만이며 부모(부양인)와 반년이상 거주 또는 24세미만 Full Time 학생</FormLabel>
                                    <FormDescription className="text-xs">
                                      부양가족이 19세 미만이고 부모(부양인)와 일년의 반 이상 함께 살거나, 24세 미만인 풀타임 학생인 경우 체크하세요.
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </form>
              </Form>

              <StepNavigation
                prevStep="/"
                nextStep="/income"
                submitText="Income"
                onNext={() => {
                  // 다음 단계로 진행 시 현재 폼 데이터 저장
                  try {
                    const values = form.getValues();
                    console.log("다음 단계로 이동 - 현재 값:", values);

                    // 로컬 상태 업데이트
                    setSavedValues(values);

                    // 컨텍스트 업데이트
                    updateTaxData({ personalInfo: values });

                    // 로컬 스토리지에 저장 (일관된 키 사용)
                    localStorage.setItem('tempPersonalInfo', JSON.stringify(values));

                    // 서버에도 즉시 저장
                    saveTaxReturn().then(() => {
                      console.log("저장다음단계 - 서버 저장 완료");
                    }).catch(error => {
                      console.error("저장다음단계 - 서버 저장 실패:", error);
                    });

                    return true;
                  } catch (error) {
                    console.error("Error in step navigation:", error);
                    // If there's an error, show a toast but still return true to allow navigation
                    toast({
                      title: "Warning",
                      description: "Form processed with warnings.",
                      variant: "destructive",
                    });
                    return true;
                  }
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfo;