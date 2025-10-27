'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

// 추가: window.ethereum 타입을 전역으로 선언하여 TS 오류 해결
declare global {
  interface Window {
    ethereum?: any
  }
}

// 1. 컨트랙트 ABI (Application Binary Interface)
// Remix IDE의 Compile 탭에서 ABI 복사 버튼을 눌러 얻을 수 있습니다.
const contractABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'counter',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decrementCounter',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getCounter',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'incrementCounter',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'resetCounter',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

export default function HomePage() {
  // 2. 상태 변수 정의
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [counter, setCounter] = useState<number>(0)
  const [contractOwner, setContractOwner] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  // ⭐️⭐️⭐️ 중요: 여기에 배포된 컨트랙트 주소를 입력하세요! ⭐️⭐️⭐️
  const contractAddress = '0x8614D2c6eF95396BF5e0602B86235694D08473f8'

  // 3. 지갑 연결 및 기본 정보 설정
  const connectWallet = async () => {
    setError('')
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' })
        const provider = new ethers.BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()
        const address = await signer.getAddress()

        setWalletAddress(address)
        setSigner(signer)

        const counterContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        )
        setContract(counterContract)

        const ownerAddress = await counterContract.owner()
        setContractOwner(ownerAddress.toLowerCase())

        setIsOwner(address.toLowerCase() === ownerAddress.toLowerCase())
      } catch (err) {
        console.error(err)
        setError('지갑 연결에 실패했습니다. 다시 시도해주세요.')
      }
    } else {
      setError(
        'MetaMask가 설치되어 있지 않습니다. 먼저 확장 프로그램을 설치해주세요.'
      )
    }
  }

  // 4. 카운터 값 가져오기 (읽기)
  const getCounterValue = async () => {
    if (contract) {
      try {
        const count = await contract.getCounter()
        setCounter(Number(count))
      } catch (err) {
        console.error(err)
        setError('카운터 값을 불러오는 데 실패했습니다.')
      }
    }
  }

  // 5. 카운터 값 변경 (쓰기 - 트랜잭션)
  const handleTransaction = async (
    action: 'increment' | 'decrement' | 'reset'
  ) => {
    if (!contract || !signer) return

    setLoading(true)
    setError('')

    try {
      let tx
      if (action === 'increment') {
        tx = await contract.incrementCounter()
      } else if (action === 'decrement') {
        tx = await contract.decrementCounter()
      } else {
        // reset
        tx = await contract.resetCounter()
      }

      // 트랜잭션이 채굴될 때까지 기다림
      await tx.wait()

      // 최신 카운터 값으로 업데이트
      getCounterValue()
    } catch (err: any) {
      console.error(err)
      const errorMessage =
        err.reason || '트랜잭션에 실패했습니다. 콘솔을 확인해주세요.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 지갑이 연결되면 카운터 값을 가져옵니다.
  useEffect(() => {
    if (contract) {
      getCounterValue()
    }
  }, [contract])

  // MetaMask 계정 변경 감지
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          connectWallet() // 계정이 변경되면 다시 연결 로직 실행
        } else {
          // 지갑 연결 해제
          setWalletAddress(null)
          setSigner(null)
          setContract(null)
          setIsOwner(false)
        }
      })
    }
  }, [])

  // 6. UI 렌더링 (JSX)
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-12 bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          카운터 DApp
        </h1>

        {walletAddress ? (
          <div className="space-y-4">
            <p className="text-sm text-center text-gray-600 truncate">
              연결된 지갑:{' '}
              <span className="font-mono text-blue-600">{walletAddress}</span>
              {isOwner && (
                <span className="ml-2 px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">
                  Owner
                </span>
              )}
            </p>

            <div className="p-6 text-center bg-gray-100 rounded-lg">
              <p className="text-lg text-gray-500">현재 카운트</p>
              <p className="text-6xl font-bold text-gray-900">{counter}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleTransaction('increment')}
                disabled={loading}
                className="w-full px-4 py-3 font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
              >
                {loading ? '처리중...' : '증가 (+)'}
              </button>
              <button
                onClick={() => handleTransaction('decrement')}
                disabled={loading}
                className="w-full px-4 py-3 font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:bg-gray-400"
              >
                {loading ? '처리중...' : '감소 (-)'}
              </button>
            </div>

            {isOwner && (
              <button
                onClick={() => handleTransaction('reset')}
                disabled={loading}
                className="w-full px-4 py-3 font-semibold text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 disabled:bg-gray-400"
              >
                {loading ? '처리중...' : '리셋 (Owner 전용)'}
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={connectWallet}
            className="w-full px-4 py-3 font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            🦊 지갑 연결하기
          </button>
        )}

        {error && (
          <div
            className="p-3 mt-4 text-sm text-center text-red-800 bg-red-100 rounded-lg"
            role="alert"
          >
            <span className="font-medium">에러:</span> {error}
          </div>
        )}
      </div>
    </main>
  )
}
