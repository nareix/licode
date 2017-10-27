package main

import (
	"bufio"
	"flag"
	"fmt"
	"os"
	"os/exec"
	"path"
	"runtime"
	"strings"
	"time"
)

var nodebinpath = "../build/libdeps/nvm/versions/node/v6.9.2/bin"
var licodenodepath = path.Join(nodebinpath, "node")
var addonnodepath = "../erizoAPI/build/Release/addon.node"
var ldlinuxpath = "/lib64/ld-linux-x86-64.so.2"

func otoolL(lib string) (paths []string, err error) {
	c := exec.Command("otool", "-L", lib)
	stdout, _ := c.StdoutPipe()
	br := bufio.NewReader(stdout)
	if err = c.Start(); err != nil {
		err = fmt.Errorf("otoolL: %s", err)
		return
	}
	for i := 0; ; i++ {
		var line string
		var rerr error
		if line, rerr = br.ReadString('\n'); rerr != nil {
			break
		}
		if i == 0 {
			continue
		}
		f := strings.Fields(line)
		if len(f) >= 2 && strings.HasPrefix(f[1], "(") {
			paths = append(paths, f[0])
		}
	}
	return
}

func installNameTool(lib string, change [][]string) error {
	args := []string{}
	for _, c := range change {
		args = append(args, "-change")
		args = append(args, c[0])
		args = append(args, c[1])
	}
	args = append(args, lib)
	c := exec.Command("install_name_tool", args...)

	if err := c.Run(); err != nil {
		return fmt.Errorf("install_name_tool: %s", err)
	}
	return nil
}

func packlibDarwin() error {
	visited := map[string]bool{}
	var dfs func(k string) error

	dfs = func(k string) error {
		if visited[k] {
			return nil
		}
		visited[k] = true
		//fmt.Println("visit", k)
		paths, err := otoolL(k)
		if err != nil {
			return err
		}
		for _, p := range paths {
			if p == "@rpath/liberizo.dylib" {
				p = "../erizo/src/erizo/liberizo.dylib"
			}
			if strings.HasPrefix(p, "@") {
				continue
			}
			if strings.HasPrefix(p, "/usr/lib") {
				continue
			}
			if strings.HasPrefix(p, "/System") {
				continue
			}
			if err := dfs(p); err != nil {
				return err
			}
		}
		return nil
	}

	if err := dfs(addonnodepath); err != nil {
		return err
	}
	if err := dfs(licodenodepath); err != nil {
		return err
	}

	change := [][]string{}
	for p := range visited {
		if !strings.HasPrefix(p, "/") {
			continue
		}
		fname := path.Join("lib", path.Base(p))
		change = append(change, []string{p, fname})
	}
	change = append(change, []string{"@rpath/liberizo.dylib", "./lib/liberizo.dylib"})

	for p := range visited {
		dstdir := "lib"
		if path.Base(p) == "node" {
			dstdir = "bin"
		}
		fname := path.Join(dstdir, path.Base(p))
		c := exec.Command("cp", "-f", p, fname)
		if err := c.Run(); err != nil {
			return fmt.Errorf("cp %s failed: %s", p, err)
		}
		c = exec.Command("chmod", "744", fname)
		if err := c.Run(); err != nil {
			return fmt.Errorf("chmod %s failed: %s", fname, err)
		}
		if err := installNameTool(fname, change); err != nil {
			return fmt.Errorf("change %s failed: %s", fname, err)
		}
		fmt.Println(fname)
	}

	return nil
}

func locate(name string) (out string) {
	root := []string{
		"../erizo/build/release/erizo",
		"../build/libdeps/build/lib",
	}
	for _, root := range root {
		p := path.Join(root, name)
		_, serr := os.Stat(p)
		if serr == nil {
			out = p
			return
		}
	}
	return
}

type Entry struct {
	Name     string
	Realpath string
}

func ldd(lib string) (paths []Entry, err error) {
	c := exec.Command("ldd", lib)
	stdout, _ := c.StdoutPipe()
	if err = c.Start(); err != nil {
		err = fmt.Errorf("ldd: %s", err)
		return
	}
	br := bufio.NewReader(stdout)
	for {
		line, rerr := br.ReadString('\n')
		if rerr != nil {
			break
		}
		f := strings.Fields(line)
		if len(f) < 3 {
			continue
		}
		if strings.HasSuffix(f[0], ":") {
			continue
		}
		name := f[0]
		if name == "" {
			continue
		}
		if name == "linux-vdso.so.1" {
			continue
		}
		if name == ldlinuxpath {
			continue
		}
		var realpath string
		if strings.HasPrefix(f[2], "/") {
			realpath = f[2]
		} else {
			realpath = locate(name)
		}
		paths = append(paths, Entry{Name: name, Realpath: realpath})
	}
	return
}

func packlibLinux() error {
	visited := map[string]Entry{}
	var dfs func(e Entry) error
	dfs = func(e Entry) (err error) {
		if _, ok := visited[e.Name]; ok {
			return
		}
		visited[e.Name] = e
		var paths []Entry
		if paths, err = ldd(e.Realpath); err != nil {
			return
		}
		for _, p := range paths {
			if err = dfs(p); err != nil {
				return
			}
		}
		return
	}
	dfs(Entry{Name: "addon.node", Realpath: addonnodepath})
	dfs(Entry{Name: "node", Realpath: licodenodepath})
	dfs(Entry{Name: "segfault-handler.node", Realpath: "./node_modules/segfault-handler/build/Release/segfault-handler.node"})
	for _, e := range visited {
		if e.Realpath == "" {
			continue
		}
		if e.Name == "segfault-handler.node" {
			continue
		}
		src := e.Realpath
		dstdir := "lib"
		if e.Name == "node" {
			dstdir = "bin"
		}
		dst := path.Join(dstdir, e.Name)
		c := exec.Command("cp", "-f", src, dst)
		if err := c.Run(); err != nil {
			err = fmt.Errorf("cp %s %s: %s", src, dst, err)
			return err
		}
		fmt.Println(e)
	}
	c := exec.Command("cp", "-f", ldlinuxpath, "lib/ld-linux.so")
	if err := c.Run(); err != nil {
		return err
	}
	return nil
}

func runPack() error {
	os.Mkdir("lib", 0744)
	os.Mkdir("bin", 0744)
	switch runtime.GOOS {
	case "darwin":
		if err := packlibDarwin(); err != nil {
			return err
		}
	case "linux":
		if err := packlibLinux(); err != nil {
			return err
		}
	}
	return nil
}

func runUpload() error {
	var c *exec.Cmd
	uploadname := fmt.Sprintf("erizod-libdeps-%s.tar.bz2", runtime.GOOS)
	tarname := fmt.Sprintf("/tmp/%d", time.Now().UnixNano())
	defer os.Remove(tarname)

	c = exec.Command("tar", "cjf", tarname, "bin", "lib", "node_modules")
	if err := c.Run(); err != nil {
		return err
	}

	c = exec.Command("qup", tarname, uploadname)
	c.Stdout = os.Stdout
	c.Stderr = os.Stderr
	if err := c.Run(); err != nil {
		return err
	}

	return nil
}

func runBuildNodeModules() error {
	c := exec.Command(path.Join(nodebinpath, "npm"), "i")
	c.Stdout = os.Stdout
	c.Stderr = os.Stderr
	if err := c.Run(); err != nil {
		return err
	}
	return nil
}

func run() error {
	flag.Parse()
	args := flag.Args()

	if len(args) == 0 {
		if err := runBuildNodeModules(); err != nil {
			return err
		}
		if err := runPack(); err != nil {
			return err
		}
		if err := runUpload(); err != nil {
			return err
		}
		return nil
	}

	op := args[0]

	switch op {
	case "pack":
		if err := runPack(); err != nil {
			return err
		}
	case "buildnodemodules":
		if err := runBuildNodeModules(); err != nil {
			return err
		}
	case "upload":
		if err := runUpload(); err != nil {
			return err
		}
	}

	return nil
}

func main() {
	if err := run(); err != nil {
		fmt.Println(err)
	}
}
